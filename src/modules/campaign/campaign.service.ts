import { Injectable, Logger } from '@nestjs/common';
import { RiseReviewPrismaService } from '../../prisma/rise-review/prisma.service';
import { AiService } from '../review-request/services/ai.service';
import { WhatsAppService } from '../review-request/services/whatsapp.service';
import { CampaignEmailService } from '../review-request/services/campaign-email.service';
import { buildReviewLinks } from '../../common/helpers/link.helper';
import type { OnboardingData } from '../../common/types/onboarding-data.type';
import type { TwilioIntegration } from '../../common/types/twilio-integration.type';
import type { Campaign } from '../../generated/rise-review/client';

@Injectable()
export class CampaignService {
  private readonly logger = new Logger(CampaignService.name);

  constructor(
    private prisma: RiseReviewPrismaService,
    private ai: AiService,
    private whatsapp: WhatsAppService,
    private email: CampaignEmailService,
  ) {}

  async sendCampaignMessages(campaignId: number) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaign) throw new Error('Campaign not found');

    const user = await this.prisma.user.findUnique({
      where: { id: campaign.userId },
    });

    if (!user) throw new Error('User not found');

    const customers = await this.prisma.customer.findMany({
      where: this.buildQuery(campaign),
    });

    if (!customers.length) return 0;

    let sent = 0;

    const onboarding = (user.onboardingData ?? undefined) as
      | OnboardingData
      | undefined;

    const businessName =
      user.name ?? onboarding?.businessInfo?.businessName ?? 'Business';

    const from = this.whatsapp.getWhatsappFrom({
      twilioIntegration: (user.twilioIntegration ?? undefined) as
        | TwilioIntegration
        | undefined,
    });

    for (const customer of customers) {
      try {
        const { positiveUrl, negativeUrl } = buildReviewLinks(
          user.id,
          customer.id,
          campaign.id,
          campaign.channel,
        );

        const firstName = customer.name.split(' ')[0] || 'there';

        const message = await this.ai.generateCampaignMessage({
          firstName,
          businessName,
          tone: campaign.tone ?? undefined,
        });

        const finalMessage =
          `${message}\n\n` +
          `😊 Great experience → ${positiveUrl}\n` +
          `😞 Not so great → ${negativeUrl}`;

        // EMAIL
        if (campaign.channel === 'email' && customer.email) {
          await this.email.sendCampaignEmail({
            businessName,
            customerEmail: customer.email,
            customerName: firstName,
            senderName: `Team ${businessName}`,
            replyToEmail: user.email,
            positiveUrl,
            negativeUrl,
          });

          sent++;
          continue;
        }

        // WHATSAPP
        if (campaign.channel === 'whatsapp' && customer.phone && from) {
          await this.whatsapp.sendMessage({
            user: {
              twilioIntegration: (user.twilioIntegration ?? undefined) as
                | TwilioIntegration
                | undefined,
            },
            to: customer.phone,
            from,
            body: finalMessage,
          });

          sent++;
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';

        this.logger.error(
          `Campaign error for customer ${customer.id}`,
          message,
        );
      }
    }

    await this.prisma.campaign.update({
      where: { id: campaign.id },
      data: {
        sent,
        recipients: customers.length,
      },
    });

    return sent;
  }

  private buildQuery(campaign: Campaign) {
    const base = {
      userId: campaign.userId,
    };

    switch (campaign.targetGroup) {
      case 'allNoReview':
        return { ...base, hasReview: false };

      case 'pastWeekNoReview':
        return {
          ...base,
          hasReview: false,
          lastVisitDate: {
            gte: new Date(Date.now() - 7 * 86400000),
          },
        };

      case 'pastMonthNoReview':
        return {
          ...base,
          hasReview: false,
          lastVisitDate: {
            gte: new Date(Date.now() - 30 * 86400000),
          },
        };

      case 'recent':
        return {
          ...base,
          lastVisitDate: {
            gte: new Date(Date.now() - 30 * 86400000),
          },
        };

      default:
        return { ...base, hasReview: false };
    }
  }
}
