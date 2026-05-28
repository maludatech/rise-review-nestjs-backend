import { Injectable, Logger } from '@nestjs/common';
import { RiseReviewPrismaService } from '../../prisma/rise-review/prisma.service';
import { AiService } from './services/ai.service';
import { LinkService } from './services/link.service';
import { WhatsappService } from '../review-request/whatsapp.service';
import { CampaignEmailService } from './services/campaign-email.service';

@Injectable()
export class CampaignService {
  private readonly logger = new Logger(CampaignService.name);

  constructor(
    private prisma: RiseReviewPrismaService,
    private ai: AiService,
    private links: LinkService,
    private whatsapp: WhatsappService,
    private email: CampaignEmailService,
  ) {}

  async sendCampaignMessages(campaignId: string) {
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

    for (const customer of customers) {
      try {
        const { positiveUrl, negativeUrl } = this.links.build(
          user.id,
          customer.id,
          campaign.id,
          campaign.channel as any,
        );

        const firstName = customer.name?.split(' ')[0] || 'there';

        // 🤖 AI message
        const message = await this.ai.generateCampaignMessage({
          firstName,
          businessName:
            user.businessName ||
            user.onboardingData?.businessName ||
            'Business',
          tone: campaign.tone ?? undefined,
        });

        const finalMessage =
          `${message}\n\n` +
          `😊 Great experience → ${positiveUrl}\n` +
          `😞 Not so great → ${negativeUrl}`;

        if (campaign.channel === 'email') {
          await this.email.sendCampaignEmail({
            businessName: user.businessName,
            customerEmail: customer.email,
            customerName: firstName,
            senderName: `Team ${user.businessName}`,
            replyToEmail: user.email,
            positiveUrl,
            negativeUrl,
          });

          sent++;
        }

        if (campaign.channel === 'whatsapp') {
          const from = this.whatsapp.getWhatsappFrom(user);

          if (!from) continue;

          await this.whatsapp.sendMessage({
            user,
            to: customer.phone,
            from,
            body: finalMessage,
          });

          sent++;
        }
      } catch (err: any) {
        this.logger.error(
          `Campaign error for customer ${customer.id}`,
          err.message,
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

  private buildQuery(campaign: any) {
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
