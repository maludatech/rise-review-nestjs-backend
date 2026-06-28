import { Module } from '@nestjs/common';
import { ReviewRequestService } from './review-request.service';
import { WhatsAppService } from './services/whatsapp.service';
import { CampaignEmailService } from './services/campaign-email.service';
import { AiService } from './services/ai.service';
import { ScraperService } from './services/scraper.service';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [EmailModule],
  providers: [
    ReviewRequestService,
    WhatsAppService,
    CampaignEmailService,
    AiService,
    ScraperService,
  ],
  exports: [ReviewRequestService, WhatsAppService, AiService, CampaignEmailService],
})
export class ReviewRequestModule {}
