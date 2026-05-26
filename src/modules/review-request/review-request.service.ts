import { Injectable } from '@nestjs/common';
import { RiseReviewPrismaService } from '../../prisma/rise-review/prisma.service';
import { WhatsAppService } from './whatsapp.service';
import { EmailService } from './email.service';
import { getVisitDelayMs } from './helpers/delay.helper';
import { getFunnelTemplates } from './template.service';
import { buildReviewLinks } from './helpers/review-link.helper';
import type { TwilioIntegration } from '../../common/types/twilio-integration.type';
import type { OnboardingData } from '../../common/types/onboarding-data.type';
import { User, Activity, Customer } from '../../generated/rise-review/client';

@Injectable()
export class ReviewRequestService {
  constructor(
    private readonly prisma: RiseReviewPrismaService,
    private readonly whatsapp: WhatsAppService,
    private readonly email: EmailService,
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

    const templates = getFunnelTemplates(user, 'email');

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
      await this.email.sendReviewEmail({
        to: customer.email,
        businessName: user.name ?? 'Business',
        customerName: firstName,
        senderName: `Team ${user.name ?? 'Business'}`,
        replyToEmail: user.email,
        positiveUrl: links.positiveUrl,
        negativeUrl: links.negativeUrl,
      });

      return 'email';
    }

    return null;
  }
}
