import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { RiseReviewPrismaService } from '../prisma/rise-review/prisma.service';
import { AiService } from '../review-request/services/ai.service';
import { WhatsAppService } from '../review-request/services/whatsapp.service';
import { CampaignEmailService } from '../review-request/services/campaign-email.service';
import { buildReviewLinks } from '../../common/helpers/link.helper';
import { mapUser } from '../../common/mappers/user.mapper';
import type { Campaign } from '../../generated/rise-review/client';
import type { CreateCampaignDto } from './dto/create-campaign.dto';
import type { UpdateCampaignDto } from './dto/update-campaign.dto';

type EffectivePlanUser = {
  subscriptionStatus: string;
  subscriptionPlan: string | null;
  trialEndDate: Date | null;
};

@Injectable()
export class CampaignService {
  private readonly logger = new Logger(CampaignService.name);

  constructor(
    private readonly prisma: RiseReviewPrismaService,
    private readonly ai: AiService,
    private readonly whatsapp: WhatsAppService,
    private readonly email: CampaignEmailService,
  ) {}

  // ── Plan helpers ───────────────────────────────────────────────────────────

  private effectivePlan(user: EffectivePlanUser): string {
    if (
      user.subscriptionStatus === 'trialing' &&
      user.trialEndDate &&
      new Date(user.trialEndDate) > new Date()
    ) {
      return 'growth';
    }
    return user.subscriptionPlan ?? 'starter';
  }

  private async checkStarterLimits(userId: number, channel: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        subscriptionPlan: true,
        subscriptionStatus: true,
        trialEndDate: true,
      },
    });

    if (!user) throw new NotFoundException('User not found');

    const plan = this.effectivePlan(user);
    if (plan !== 'starter') return;

    if (channel === 'whatsapp') {
      throw new ForbiddenException({
        message: 'WhatsApp campaigns require the Growth plan. Please upgrade.',
        code: 'WHATSAPP_REQUIRES_GROWTH',
      });
    }
  }

  private async checkMonthlyCampaignLimit(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        subscriptionPlan: true,
        subscriptionStatus: true,
        trialEndDate: true,
      },
    });

    if (!user) throw new NotFoundException('User not found');

    const plan = this.effectivePlan(user);
    if (plan !== 'starter') return;

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const count = await this.prisma.campaign.count({
      where: { userId, createdAt: { gte: startOfMonth } },
    });

    if (count >= 2) {
      throw new ForbiddenException({
        message:
          'Starter plan is limited to 2 campaigns per month. Upgrade to Growth for unlimited campaigns.',
        code: 'MONTHLY_CAMPAIGN_LIMIT',
      });
    }
  }

  // ── CRUD ──────────────────────────────────────────────────────────────────

  async createCampaign(userId: number, dto: CreateCampaignDto) {
    const channel = dto.channel ?? 'email';

    await this.checkStarterLimits(userId, channel);
    await this.checkMonthlyCampaignLimit(userId);

    const isScheduled = dto.isScheduled ?? false;
    let initialStatus = dto.status ?? (isScheduled ? 'pending' : 'pending');

    if (dto.status === 'draft') initialStatus = 'draft';

    // Require customers for non-draft launches
    if (initialStatus !== 'draft') {
      const customerCount = await this.prisma.customer.count({
        where: { userId },
      });
      if (customerCount === 0) {
        throw new BadRequestException({
          message:
            'No customers found. Upload your customer list from the Customers page before launching a campaign.',
          code: 'NO_CUSTOMERS',
        });
      }
    }

    const campaign = await this.prisma.campaign.create({
      data: {
        userId,
        name: dto.name.trim(),
        channel: channel,
        platforms: dto.platforms ?? ['google'],
        targetGroup: dto.targetGroup ?? 'hasNoReview',
        timing: dto.timing ?? 'SEVEN_DAYS',
        language: dto.language ?? 'en',
        date: dto.date ? new Date(dto.date) : null,
        isScheduled,
        tone: dto.useGPT ? (dto.tone ?? null) : null,
        message: dto.useGPT ? '' : (dto.message ?? ''),
        useGPT: dto.useGPT ?? false,
        status: initialStatus,
      },
    });

    await this.prisma.activity.create({
      data: {
        type: 'campaign',
        userId,
        sourceId: String(campaign.id),
        platform: channel.toUpperCase(),
        preview: `Campaign "${campaign.name}" created`,
      },
    });

    if (initialStatus === 'draft' || isScheduled) {
      return campaign;
    }

    return this.dispatchAndReturn(campaign, userId);
  }

  async getCampaigns(userId: number) {
    return this.prisma.campaign.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getCampaignById(userId: number, id: number) {
    const campaign = await this.prisma.campaign.findFirst({
      where: { id, userId },
    });
    if (!campaign) throw new NotFoundException('Campaign not found');
    return campaign;
  }

  async updateCampaign(userId: number, id: number, dto: UpdateCampaignDto) {
    const campaign = await this.prisma.campaign.findFirst({
      where: { id, userId },
    });
    if (!campaign) throw new NotFoundException('Campaign not found');

    // Locked fields after send
    if (campaign.status === 'sent' || campaign.sent > 0) {
      const allowed = new Set(['name', 'tone']);
      const attempted = Object.keys(dto).filter(
        (k) =>
          !allowed.has(k) && dto[k as keyof UpdateCampaignDto] !== undefined,
      );
      if (attempted.length > 0) {
        throw new BadRequestException(
          `Cannot modify ${attempted.join(', ')} after campaign has been sent.`,
        );
      }
    }

    const updateData: Partial<Campaign> = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.channel !== undefined) updateData.channel = dto.channel;
    if (dto.platforms !== undefined) updateData.platforms = dto.platforms;
    if (dto.targetGroup !== undefined) updateData.targetGroup = dto.targetGroup;
    if (dto.timing !== undefined) updateData.timing = dto.timing;
    if (dto.language !== undefined) updateData.language = dto.language;
    if (dto.date !== undefined) updateData.date = new Date(dto.date);
    if (dto.isScheduled !== undefined) updateData.isScheduled = dto.isScheduled;

    if (dto.useGPT === true) {
      updateData.useGPT = true;
      updateData.message = '';
      if (dto.tone !== undefined) updateData.tone = dto.tone;
    } else if (dto.useGPT === false) {
      updateData.useGPT = false;
      updateData.tone = null;
      if (dto.message !== undefined) updateData.message = dto.message;
    } else {
      if (dto.tone !== undefined) updateData.tone = dto.tone;
      if (dto.message !== undefined) updateData.message = dto.message;
    }

    const updated = await this.prisma.campaign.update({
      where: { id },
      data: updateData as Parameters<
        typeof this.prisma.campaign.update
      >[0]['data'],
    });

    await this.prisma.activity.create({
      data: {
        type: 'campaign',
        userId,
        sourceId: String(id),
        platform: updated.channel.toUpperCase(),
        preview: `Campaign "${updated.name}" updated`,
      },
    });

    return updated;
  }

  async deleteCampaign(userId: number, id: number) {
    const campaign = await this.prisma.campaign.findFirst({
      where: { id, userId },
    });
    if (!campaign) throw new NotFoundException('Campaign not found');
    await this.prisma.campaign.delete({ where: { id } });
  }

  async startCampaign(userId: number, id: number) {
    const campaign = await this.prisma.campaign.findFirst({
      where: { id, userId },
    });
    if (!campaign) throw new NotFoundException('Campaign not found');

    if (campaign.status !== 'draft') {
      throw new BadRequestException('Only drafts can be started');
    }

    await this.checkStarterLimits(userId, campaign.channel);

    const customerCount = await this.prisma.customer.count({
      where: { userId },
    });
    if (customerCount === 0) {
      throw new BadRequestException({
        message:
          'No customers found. Upload your customer list from the Customers page before launching.',
        code: 'NO_CUSTOMERS',
      });
    }

    return this.dispatchAndReturn(campaign, userId);
  }

  async pauseCampaign(userId: number, id: number) {
    const campaign = await this.prisma.campaign.findFirst({
      where: { id, userId },
    });
    if (!campaign) throw new NotFoundException('Campaign not found');

    if (campaign.status !== 'pending' && campaign.status !== 'sent') {
      throw new BadRequestException(
        'Only pending or sent campaigns can be paused',
      );
    }

    const updated = await this.prisma.campaign.update({
      where: { id },
      data: { status: 'paused' },
    });

    await this.prisma.activity.create({
      data: {
        type: 'campaign',
        userId,
        sourceId: String(id),
        platform: campaign.channel.toUpperCase(),
        preview: `Campaign "${campaign.name}" paused`,
      },
    });

    return updated;
  }

  async resumeCampaign(userId: number, id: number) {
    const campaign = await this.prisma.campaign.findFirst({
      where: { id, userId },
    });
    if (!campaign) throw new NotFoundException('Campaign not found');

    if (campaign.status !== 'paused') {
      throw new BadRequestException('Only paused campaigns can be resumed');
    }

    const newStatus = campaign.isScheduled ? 'pending' : 'sent';

    const updated = await this.prisma.campaign.update({
      where: { id },
      data: { status: newStatus },
    });

    await this.prisma.activity.create({
      data: {
        type: 'campaign',
        userId,
        sourceId: String(id),
        platform: campaign.channel.toUpperCase(),
        status: newStatus,
        preview: `Campaign "${campaign.name}" resumed`,
      },
    });

    return updated;
  }

  async getCampaignVerdicts(userId: number, id: number) {
    const [positive, negative] = await Promise.all([
      this.prisma.activity.count({
        where: {
          userId,
          sourceId: String(id),
          type: 'review',
          verdict: 'positive',
        },
      }),
      this.prisma.activity.count({
        where: {
          userId,
          sourceId: String(id),
          type: 'review',
          verdict: 'negative',
        },
      }),
    ]);

    return { positive, negative };
  }

  // ── Send helper ────────────────────────────────────────────────────────────

  private async dispatchAndReturn(campaign: Campaign, userId: number) {
    let sentCount: number;

    try {
      sentCount = await this.sendCampaignMessages(campaign.id);
    } catch (err: unknown) {
      await this.prisma.campaign.update({
        where: { id: campaign.id },
        data: { status: 'draft' },
      });

      const msg = err instanceof Error ? err.message : '';

      if (msg.startsWith('WHATSAPP_NOT_READY:')) {
        const hoursRemaining = parseInt(msg.split(':')[1], 10);
        throw new BadRequestException({
          message: `Your WhatsApp number is still being activated by Meta. It will be ready in approximately ${hoursRemaining} hour(s). Your campaign has been saved as a draft.`,
          code: 'WHATSAPP_NOT_READY',
          hoursRemaining,
        });
      }

      throw new BadRequestException({
        message:
          msg ||
          'Campaign created but failed to send messages. It has been saved as a draft.',
        code: 'SEND_FAILED',
        campaignId: campaign.id,
      });
    }

    if (sentCount === 0) {
      await this.prisma.campaign.update({
        where: { id: campaign.id },
        data: { status: 'draft' },
      });
      throw new BadRequestException({
        message:
          'No customers match the selected target group. Check your customer list or try a different target group.',
        code: 'NO_MATCHING_CUSTOMERS',
      });
    }

    const updated = await this.prisma.campaign.update({
      where: { id: campaign.id },
      data: { status: 'sent' },
    });

    await this.prisma.activity.create({
      data: {
        type: 'campaign',
        userId,
        sourceId: String(campaign.id),
        platform: campaign.channel.toUpperCase(),
        status: 'sent',
        preview: `Campaign "${campaign.name}" sent to ${sentCount} recipients`,
      },
    });

    return updated;
  }

  // ── sendCampaignMessages (existing logic, kept intact) ────────────────────

  async sendCampaignMessages(campaignId: number) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
    });
    if (!campaign) throw new Error('Campaign not found');

    const rawUser = await this.prisma.user.findUnique({
      where: { id: campaign.userId },
    });
    if (!rawUser) throw new Error('User not found');

    const user = mapUser(rawUser);
    const customers = await this.prisma.customer.findMany({
      where: this.buildQuery(campaign),
    });

    if (!customers.length) return 0;

    let sent = 0;
    const businessName =
      user.name ??
      user.onboardingData?.businessInfo?.businessName ??
      'Business';

    const from = this.whatsapp.getWhatsappFrom({
      twilioIntegration: user.twilioIntegration,
    });

    for (const customer of customers) {
      try {
        const { positiveUrl, negativeUrl } = buildReviewLinks(
          user.id,
          customer.id,
          campaign.id,
          campaign.channel,
        );

        const firstName = customer.name?.split(' ')[0] || 'there';
        let message: string;

        if (campaign.useGPT) {
          message = await this.ai.generateCampaignMessage({
            firstName,
            businessName,
            tone: campaign.tone ?? undefined,
            language: campaign.language ?? 'en',
          });
        } else {
          const raw = campaign.message ?? '';
          message = raw
            .replace(/{name}/gi, firstName)
            .replace(/{FirstName}/gi, firstName)
            .replace(/{business_name}/gi, businessName)
            .replace(/{BusinessName}/gi, businessName)
            .replace(/{review_link}/gi, positiveUrl);
        }

        const finalMessage =
          `${message}\n\n` +
          `😊 Great experience → ${positiveUrl}\n` +
          `😞 Not so great → ${negativeUrl}`;

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

        if (campaign.channel === 'whatsapp' && customer.phone && from) {
          await this.whatsapp.sendMessage({
            user: { twilioIntegration: user.twilioIntegration },
            to: customer.phone,
            from,
            body: finalMessage,
          });
          sent++;
        }
      } catch (err: unknown) {
        this.logger.error(
          `Campaign error for customer ${customer.id}`,
          err instanceof Error ? err.message : 'Unknown error',
        );
      }
    }

    await this.prisma.campaign.update({
      where: { id: campaign.id },
      data: { sent, recipients: customers.length },
    });

    return sent;
  }

  private buildQuery(campaign: Campaign) {
    const base = { userId: campaign.userId };

    switch (campaign.targetGroup) {
      case 'allNoReview':
        return { ...base, hasReview: false };
      case 'pastWeekNoReview':
        return {
          ...base,
          hasReview: false,
          lastVisitDate: { gte: new Date(Date.now() - 7 * 86400000) },
        };
      case 'pastMonthNoReview':
        return {
          ...base,
          hasReview: false,
          lastVisitDate: { gte: new Date(Date.now() - 30 * 86400000) },
        };
      case 'recent':
        return {
          ...base,
          lastVisitDate: { gte: new Date(Date.now() - 30 * 86400000) },
        };
      default:
        return { ...base, hasReview: false };
    }
  }
}
