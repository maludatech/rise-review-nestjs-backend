import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RiseReviewPrismaService } from '../modules/prisma/rise-review/prisma.service';
import { InternalPrismaService } from '../modules/prisma/internal/prisma.service';
import { EmailService } from '../modules/email/email.service';
import { ReviewRequestService } from '../modules/review-request/review-request.service';
import { OutreachService } from '../modules/outreach/outreach.service';
import { CampaignService } from '../modules/campaign/campaign.service';
import { EnrichmentService } from '../modules/internal/enrichment/enrichment.service';

@Injectable()
export class CronService {
  private readonly logger = new Logger(CronService.name);

  constructor(
    private readonly riseReviewPrisma: RiseReviewPrismaService,
    private readonly internalPrisma: InternalPrismaService,
    private readonly emailService: EmailService,
    private readonly reviewRequestService: ReviewRequestService,
    private readonly outreachService: OutreachService,
    private readonly campaignService: CampaignService,
    private readonly enrichmentService: EnrichmentService,
  ) {}

  @Cron('* * * * *')
  async enrichLeads() {
    try {
      await this.enrichmentService.enrichPendingLeads();
    } catch (err) {
      this.logger.error('enrichLeads failed', err);
    }
  }

  @Cron('*/2 * * * *')
  async sendOutreach() {
    try {
      await this.outreachService.sendOutreachEmails();
    } catch (err) {
      this.logger.error('sendOutreach failed', err);
    }
  }

  @Cron('0 10 */2 * *')
  async sendFollowUps() {
    try {
      await this.outreachService.sendFollowUpEmails();
    } catch (err) {
      this.logger.error('sendFollowUps failed', err);
    }
  }

  @Cron('* * * * *')
  async dispatchScheduledCampaigns() {
    try {
      // TODO: query campaigns where isScheduled=true, status=pending, date <= now and dispatch
    } catch (err) {
      this.logger.error('dispatchScheduledCampaigns failed', err);
    }
  }

  @Cron('*/10 * * * *')
  async scrapeAndAutoRespond() {
    try {
      await this.reviewRequestService.scrapeAndSaveReviewsForAllUsers();
      await this.reviewRequestService.autoRespondForAllUsers();
    } catch (err) {
      this.logger.error('scrapeAndAutoRespond failed', err);
    }
  }

  @Cron('*/30 * * * *')
  async syncReservations() {
    try {
      await this.reviewRequestService.processReservationReviewRequests();
    } catch (err) {
      this.logger.error('syncReservations failed', err);
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async sendDailyReports() {
    try {
      // TODO: implement daily performance report emails
      this.logger.debug('Sending daily reports...');
    } catch (err) {
      this.logger.error('sendDailyReports failed', err);
    }
  }

  @Cron(CronExpression.EVERY_WEEK)
  async sendWeeklyReports() {
    try {
      // TODO: implement weekly report emails
      this.logger.debug('Sending weekly reports...');
    } catch (err) {
      this.logger.error('sendWeeklyReports failed', err);
    }
  }
}
