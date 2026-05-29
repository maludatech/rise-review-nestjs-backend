import { Module } from '@nestjs/common';
import { ReviewRequestModule } from '../review-request/review-request.module';
import { CampaignService } from './campaign.service';

@Module({
  imports: [ReviewRequestModule],
  providers: [CampaignService],
})
export class CampaignModule {}
