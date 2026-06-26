import { Module } from '@nestjs/common';
import { CronService } from './cron.service';
import { EmailModule } from '../modules/email/email.module';
import { OutreachModule } from '../modules/outreach/outreach.module';
import { CampaignModule } from '../modules/campaign/campaign.module';
import { ReviewRequestModule } from '../modules/review-request/review-request.module';
import { EnrichmentModule } from '../modules/internal/enrichment/enrichment.module';

@Module({
  imports: [EmailModule, OutreachModule, CampaignModule, ReviewRequestModule, EnrichmentModule],
  providers: [CronService],
})
export class CronModule {}
