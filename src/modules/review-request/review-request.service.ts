import { Injectable } from '@nestjs/common';
import React from 'react';
import { RiseReviewPrismaService } from '../../prisma/rise-review/prisma.service';
import { WhatsAppService } from './services/whatsapp.service';
import { EmailService } from '../email/email.service';
import { AiService } from './services/ai.service';
import { ScraperService } from './services/scraper.service';
import { CampaignEmailService } from './services/campaign-email.service';
import { getVisitDelayMs } from './helpers/delay.helper';
import { getFunnelTemplates } from './helpers/funnel-template.helper';
import CampaignEmail from '../../../emails/CampaignEmail';
import { buildReviewLinks } from '../../common/helpers/link.helper';
import { User, Activity, Customer } from '../../generated/rise-review/client';
import type { TwilioIntegration } from '../../common/types/twilio-integration.type';
import type { OnboardingData } from '../../common/types/onboarding-data.type';
import {
  GoogleBusiness,
  NotificationPreferences,
  OnboardingDataReview,
  ReviewEntity,
  SafeUser,
  ScrapedReview,
} from '../../common/types/review.type';

@Injectable()
export class ReviewRequestService {
  constructor(
    private readonly prisma: RiseReviewPrismaService,
    private readonly whatsapp: WhatsAppService,
    private readonly email: EmailService,
    private ai: AiService,
    private scraper: ScraperService,
    private campaignEmail: CampaignEmailService,
  ) {}

  async processReservationReviewRequests() {
    const users = await this.prisma.user.findMany({
      where: {
        OR: [{ openTableConnected: true }, { covermanagerConnected: true }],
      },
    });

    for (const user of users) {
      const onboarding = user.onboardingData as OnboardingData | null;
      const delayMs = getVisitDelayMs(onboarding?.reviewTiming);
      const cutoff = new Date(Date.now() - delayMs);

      const reservations = await this.prisma.activity.findMany({
        where: {
          userId: user.id,
          type: 'reservation',
          status: 'pending',
          createdAt: { lte: cutoff },
        },
      });

      for (const reservation of reservations) {
        await this.handleReservation(user, reservation);
      }
    }
  }

  private async handleReservation(user: User, reservation: Activity) {
    const customerName = reservation.customer || '';

    const customer = await this.prisma.customer.findFirst({
      where: {
        userId: user.id,
        name: customerName,
      },
    });

    if (!customer || customer.hasReview) return;

    const templates = getFunnelTemplates(
      {
        onboardingData: user.onboardingData as OnboardingData | null,
      },
      'email',
    );

    const links = buildReviewLinks(
      user.id,
      customer.id,
      reservation.id,
      'email',
    );

    const channel = await this.sendWithFallback({
      user,
      customer,
      reservation,
      templates,
      links,
    });

    if (channel) {
      await this.prisma.activity.update({
        where: { id: reservation.id },
        data: { status: 'intercepting' },
      });
    }
  }

  private async sendWithFallback(opts: {
    user: User;
    customer: Customer;
    reservation: Activity;
    links: {
      positiveUrl: string;
      negativeUrl: string;
    };
    templates: {
      initial: string;
    };
  }) {
    const { user, customer, links, templates } = opts;

    const firstName = customer.name.split(' ')[0];

    // ✅ NO any, NO unsafe casting
    const twilioIntegration = user.twilioIntegration as TwilioIntegration;

    const twilio = this.whatsapp.getUserClient(
      twilioIntegration?.subaccountSid,
    );

    const whatsappFrom = twilioIntegration?.whatsapp?.phoneNumber;

    if (customer.phone && whatsappFrom) {
      try {
        const message = templates.initial
          .replace('{FirstName}', firstName)
          .replace('{BusinessName}', user.name ?? 'Business');

        await twilio.messages.create({
          body: `${message}\n\n👍 ${links.positiveUrl}\n👎 ${links.negativeUrl}`,
          from: `whatsapp:${whatsappFrom}`,
          to: `whatsapp:${customer.phone}`,
        });

        return 'whatsapp';
      } catch {
        // fallback email
      }
    }

    if (customer.email) {
      await this.email.sendEmail({
        to: customer.email,
        subject: `How was your visit to ${user.name ?? 'Business'}?`,
        reactComponent: React.createElement(CampaignEmail, {
          businessName: user.name ?? 'Business',
          reviewLink: links.positiveUrl,
          negativeUrl: links.negativeUrl,
          customerName: firstName,
          senderName: `Team ${user.name ?? 'Business'}`,
          replyToEmail: user.email,
        }),
      });

      return 'email';
    }

    return null;
  }

  async scrapeAndSaveReviews(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) throw new Error('User not found');

    const googleBusiness = user.googleBusiness as GoogleBusiness | null;

    const url = googleBusiness?.url ?? user.businessUrl;

    if (!url) return 0;

    const reviews = (await this.scraper.scrapeGoogleReviews(
      url,
    )) as ScrapedReview[];

    let saved = 0;

    for (const r of reviews) {
      const rating = Number(r.stars ?? r.rating ?? 0);
      if (rating < 1 || rating > 5) continue;

      const reviewerName = typeof r.name === 'string' ? r.name : null;
      const comment = typeof r.text === 'string' ? r.text : '';

      const existing = await this.prisma.review.findFirst({
        where: {
          userId,
          reviewerName,
          reviewDate: r.publishedAtDate,
        },
      });

      if (existing) continue;

      const review = await this.prisma.review.create({
        data: {
          userId,
          rating,
          comment,
          reviewerName,
          reviewDate: r.publishedAtDate ? new Date(r.publishedAtDate) : null,
          source: 'google',
          responded: false,
          sentNotification: false,
        },
      });

      saved++;

      await this.sendNotifications(user, review);
      await this.autoRespond(review.id, review);
    }

    return saved;
  }

  async autoRespond(reviewId: number, review: ReviewEntity) {
    const existing = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (existing?.responseText) return;

    const response = await this.ai.generateReviewResponse({
      ...review,
      comment: review.comment ?? '',
    });

    await this.prisma.review.update({
      where: { id: reviewId },
      data: { responseText: response },
    });

    await this.prisma.campaign.updateMany({
      where: { userId: review.userId },
      data: {
        responded: { increment: 1 },
      },
    });
  }

  private async sendNotifications(user: SafeUser, review: ReviewEntity) {
    const notifications =
      user.notificationPreferences as NotificationPreferences | null;

    const onboarding = user.onboardingData as OnboardingDataReview | null;

    const googleBusiness = user.googleBusiness as GoogleBusiness | null;

    const businessName =
      onboarding?.businessInfo?.businessName ??
      googleBusiness?.name ??
      user.name ??
      'Business';

    const customerName = user.name ?? 'Customer';

    if (notifications?.email?.newReview) {
      await this.campaignEmail.sendCampaignEmail({
        businessName,
        customerEmail: user.email,
        customerName,
        senderName: 'Rise Review',
        replyToEmail: user.email,
        positiveUrl: '',
        negativeUrl: '',
      });
    }

    if (review.rating <= 2 && notifications?.email?.negativeReview) {
      await this.campaignEmail.sendCampaignEmail({
        businessName,
        customerEmail: user.email,
        customerName,
        senderName: 'Rise Review Alerts',
        replyToEmail: user.email,
        positiveUrl: '',
        negativeUrl: '',
      });
    }
  }
}
