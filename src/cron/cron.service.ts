import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ReviewRequestService } from '../modules/review-request/review-request.service';
import { OutreachService } from '../modules/outreach/outreach.service';
import { EnrichmentService } from '../modules/internal/enrichment/enrichment.service';

@Injectable()
export class CronService {
  private readonly logger = new Logger(CronService.name);

  constructor(
    private readonly reviewRequestService: ReviewRequestService,
    private readonly outreachService: OutreachService,
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
  dispatchScheduledCampaigns() {
    // TODO: query campaigns where isScheduled=true, status=pending, date <= now and dispatch
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
  sendDailyReports() {
    // TODO: implement daily performance report emails
    this.logger.debug('Sending daily reports...');
  }

  @Cron(CronExpression.EVERY_WEEK)
  sendWeeklyReports() {
    // TODO: implement weekly report emails
    this.logger.debug('Sending weekly reports...');
  }
}
