import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RiseReviewPrismaService } from '../../src/prisma/rise-review/prisma.service';
import { InternalPrismaService } from '../../src/prisma/internal/prisma.service';
import { EmailService } from '../modules/email/email.service';
import { ReviewRequestService } from '../modules/review-request/review-request.service';
import { OutreachService } from '../modules/outreach/outreach.service';
import DailyPerformanceReportEmail from '../../emails/DailyPerformanceReportEmail';
import WeeklyReportEmail from '../../emails/WeeklyReportEmail';

@Injectable()
export class CronService {
  private readonly logger = new Logger(CronService.name);
  constructor(
    private readonly riseReviewPrismaService: RiseReviewPrismaService,
    private readonly internalPrismaService: InternalPrismaService,
    private readonly emailService: EmailService,
    private readonly reviewRequestService: ReviewRequestService,
    private readonly outreachService: OutreachService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleDailyTasks() {
    await this.reviewRequestService.processReservationReviewRequests();
    await this.reviewRequestService.autoRespond(reviewId, review);
    await this.reviewRequestService.scrapeAndSaveReviews(userId);
    await this.emailService.sendEmail();
    await this.outreachService.sendOutreachEmails();
    await this.outreachService.sendFollowUpEmails();
    this.logger.debug('Running daily tasks...');
  }
}
