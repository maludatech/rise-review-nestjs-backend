import { Injectable, Logger } from '@nestjs/common';
import React from 'react';
import { RiseReviewPrismaService } from '../prisma/rise-review/prisma.service';
import { EmailService } from '../email/email.service';
import { WhatsAppService } from '../review-request/services/whatsapp.service';
import { verifyReviewToken } from '../../common/helpers/review-token.helper';
import { getFunnelTemplates } from '../review-request/helpers/funnel-template.helper';
import { mapUser } from '../../common/mappers/user.mapper';
import type { OnboardingData } from '../../common/types/onboarding-data.type';
import CampaignEmail from '../../../emails/CampaignEmail';

type GoogleBusiness = { url?: string; name?: string };

@Injectable()
export class ReviewResponseService {
  private readonly logger = new Logger(ReviewResponseService.name);

  constructor(
    private readonly prisma: RiseReviewPrismaService,
    private readonly emailService: EmailService,
    private readonly whatsapp: WhatsAppService,
  ) {}

  async handleResponse(token: string): Promise<{
    redirectUrl: string;
    followUp: (() => Promise<void>) | null;
  }> {
    const payload = verifyReviewToken(token);
    const { userId, customerId, activityId, channel, verdict } = payload;

    const [rawUser, customer] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: userId } }),
      this.prisma.customer.findUnique({ where: { id: customerId } }),
    ]);

    if (!rawUser || !customer) {
      throw new Error('USER_OR_CUSTOMER_NOT_FOUND');
    }

    const user = mapUser(rawUser);
    const onboarding = user.onboardingData as OnboardingData | null;
    const googleBusiness = user.googleBusiness as GoogleBusiness | null;

    const businessName =
      onboarding?.businessInfo?.businessName?.trim() ??
      googleBusiness?.name ??
      'the business';

    const googleReviewLink =
      googleBusiness?.url ?? process.env.FRONTEND_URL ?? 'https://google.com';

    const negativeRedirectUrl = `${process.env.FRONTEND_URL}/feedback?t=${token}`;

    const redirectUrl =
      verdict === 'positive' ? googleReviewLink : negativeRedirectUrl;

    // ── Resolve source: try activity first, then campaign ─────────────────
    let sourceType: 'activity' | 'campaign' | null = null;

    const activity = await this.prisma.activity.findUnique({
      where: { id: activityId },
    });

    if (activity) {
      sourceType = 'activity';
    } else {
      const campaign = await this.prisma.campaign.findUnique({
        where: { id: activityId },
      });
      if (campaign) sourceType = 'campaign';
    }

    if (!sourceType) {
      this.logger.warn(
        `[review-response] Source ${activityId} not found — redirecting anyway`,
      );
      return { redirectUrl, followUp: null };
    }

    // ── Activity source ───────────────────────────────────────────────────
    if (sourceType === 'activity' && activity) {
      // Idempotency: already responded
      if (activity.status === 'sent') {
        return { redirectUrl, followUp: null };
      }

      await this.prisma.activity.update({
        where: { id: activityId },
        data: {
          status: 'sent',
          interceptedRating: verdict === 'positive' ? 5 : 1,
        },
      });
    }

    // ── Campaign source ───────────────────────────────────────────────────
    if (sourceType === 'campaign') {
      const alreadyResponded = await this.prisma.activity.findFirst({
        where: {
          userId,
          type: 'review',
          sourceId: String(activityId),
          sourceCustomerId: String(customerId),
        },
      });

      if (alreadyResponded) {
        return { redirectUrl, followUp: null };
      }

      if (verdict === 'positive') {
        await Promise.all([
          this.prisma.campaign.update({
            where: { id: activityId },
            data: { responded: { increment: 1 } },
          }),
          this.prisma.customer.update({
            where: { id: customerId },
            data: { hasReview: true },
          }),
        ]);
      }

      await this.prisma.activity.create({
        data: {
          userId,
          type: 'review',
          sourceId: String(activityId),
          sourceCustomerId: String(customerId),
          platform: channel.toUpperCase(),
          customer: customer.name ?? 'Unknown',
          preview: `Customer tapped ${verdict === 'positive' ? '😊 Great experience' : '😞 Not so great'}`,
          status: 'sent',
          interceptedRating: verdict === 'positive' ? 5 : 1,
          verdict,
        },
      });
    }

    // ── Build fire-and-forget follow-up closure ───────────────────────────
    const followUp = async () => {
      const firstName = customer.name?.split(' ')[0] ?? 'there';
      const templates = getFunnelTemplates({ onboardingData: onboarding }, channel);

      const message =
        verdict === 'positive'
          ? templates.positive
              .replace(/{FirstName}/gi, firstName)
              .replace(/{BusinessName}/gi, businessName)
              .replace(/{review_link}/gi, googleReviewLink)
          : templates.negative
              .replace(/{FirstName}/gi, firstName)
              .replace(/{BusinessName}/gi, businessName)
              .replace(/{feedback_link}/gi, negativeRedirectUrl)
              .replace(/{review_link}/gi, negativeRedirectUrl);

      const from = this.whatsapp.getWhatsappFrom({
        twilioIntegration: user.twilioIntegration,
      });

      if (channel === 'whatsapp' && customer.phone && from) {
        await this.whatsapp.sendMessage({
          user: { twilioIntegration: user.twilioIntegration },
          to: customer.phone,
          from,
          body: message,
        });
        return;
      }

      if (channel === 'email' && customer.email) {
        const subject =
          verdict === 'positive'
            ? 'Thank you! 🌟 One more step...'
            : "We'd love to make it right";

        await this.emailService.sendEmail({
          to: customer.email,
          subject,
          from: `${businessName} <campaigns@risereview.io>`,
          reactComponent: React.createElement(CampaignEmail, {
            businessName,
            reviewLink:
              verdict === 'positive' ? googleReviewLink : negativeRedirectUrl,
            negativeUrl: negativeRedirectUrl,
            customerName: firstName,
            senderName: `Team ${businessName}`,
            replyToEmail: rawUser.email,
          }),
        });
      }
    };

    return { redirectUrl, followUp };
  }
}
