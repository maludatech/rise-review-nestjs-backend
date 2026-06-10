import { Injectable, Logger } from '@nestjs/common';
import React from 'react';
import { randomBytes } from 'crypto';
import { InternalPrismaService } from '../prisma/internal/prisma.service';
import { EmailService } from '../email/email.service';
import FollowUpEmail from '../../../emails/FollowUpEmail';
import OutreachEmail from '../../../emails/OutreachEmail';
import { sleep } from '../../common/helpers/sleep.helper';

@Injectable()
export class OutreachService {
  private readonly logger = new Logger(OutreachService.name);

  private readonly PUBLIC_URL =
    process.env.PUBLIC_URL || 'https://review-flow.onrender.com';

  constructor(
    private readonly prisma: InternalPrismaService,
    private readonly emailService: EmailService,
  ) {}

  async sendOutreachEmails(limit = 5) {
    const leads = await this.prisma.lead.findMany({
      where: {
        isEnriched: true,
        emailSent: false,
        unsubscribed: false,
      },
      take: limit,
    });

    if (!leads.length) {
      this.logger.log('✅ No enriched leads to send emails to.');
      return;
    }

    this.logger.log(`📧 Sending outreach emails to ${leads.length} leads...`);

    for (const lead of leads) {
      try {
        let unsubscribeToken = lead.unsubscribeToken;

        if (!unsubscribeToken) {
          unsubscribeToken = randomBytes(16).toString('hex');

          await this.prisma.lead.update({
            where: {
              id: lead.id,
            },
            data: {
              unsubscribeToken,
            },
          });
        }

        // const pixelUrl = `${this.PUBLIC_URL}/api/email/open/${lead.id}?t=${Date.now()}`;

        const unsubscribeUrl = `${this.PUBLIC_URL}/unsubscribe/${unsubscribeToken}`;

        const landingUrl = `${this.PUBLIC_URL}/api/email/track-click/${lead.id}`;

        await this.emailService.sendEmail({
          to: lead.email,
          subject: `Boost Your ${lead.businessName} Reviews 🚀`,
          reactComponent: React.createElement(OutreachEmail, {
            businessName: lead.businessName,
            googleRating: lead.googleRating ?? 0,
            landingUrl,
            unsubscribeUrl,
          }),
        });

        await this.prisma.lead.update({
          where: {
            id: lead.id,
          },
          data: {
            emailSent: true,
            sentAt: new Date(),
          },
        });

        await this.prisma.leadHistory.create({
          data: {
            leadId: lead.id,
            action: 'EMAIL_SENT',
            metadata: {
              subject: `Boost Your ${lead.businessName} Reviews 🚀`,
            },
          },
        });

        this.logger.log(
          `✅ Email sent to ${lead.businessName} (${lead.email})`,
        );

        await sleep(1500);
      } catch (error) {
        this.logger.error(
          `❌ Failed to send email to ${lead.businessName}`,
          error instanceof Error ? error.stack : String(error),
        );
      }
    }
  }
  async sendFollowUpEmails(limit = 10): Promise<void> {
    const leads = await this.prisma.lead.findMany({
      where: {
        emailSent: true,
        replied: false,
        opened: false,
        sentAt: { lte: new Date() },
        resendCount: { lt: 2 },
        unsubscribed: { not: true },
      },
      take: limit,
    });

    if (!leads.length) return;

    for (const lead of leads) {
      try {
        let unsubscribeToken = lead.unsubscribeToken;

        if (!unsubscribeToken) {
          unsubscribeToken = randomBytes(16).toString('hex');

          await this.prisma.lead.update({
            where: { id: lead.id },
            data: { unsubscribeToken },
          });
        }

        const unsubscribeUrl = `${this.PUBLIC_URL}/unsubscribe/${unsubscribeToken}`;

        await this.emailService.sendEmail({
          to: lead.email,
          subject: 'Quick follow-up from Rise Review',
          reactComponent: React.createElement(FollowUpEmail, {
            businessName: lead.businessName,
            city: lead.city,
            unsubscribeUrl,
          }),
        });

        await this.prisma.lead.update({
          where: { id: lead.id },
          data: {
            resendCount: (lead.resendCount ?? 0) + 1,
            sentAt: new Date(),
          },
        });

        await this.prisma.leadHistory.create({
          data: {
            leadId: lead.id,
            action: 'FOLLOW_UP_SENT',
            metadata: {
              subject: 'Quick follow-up from Rise Review',
            },
          },
        });

        await sleep(1500);
      } catch (error) {
        this.logger.error(
          `❌ Failed follow-up for ${lead.email}`,
          error instanceof Error ? error.stack : String(error),
        );
      }
    }
  }
}
