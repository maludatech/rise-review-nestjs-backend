import { Module } from '@nestjs/common';
import { ReviewRequestModule } from '../review-request/review-request.module';
import { CampaignService } from './campaign.service';
import { CampaignController } from './campaign.controller';

@Module({
  imports: [ReviewRequestModule],
  controllers: [CampaignController],
  providers: [CampaignService],
  exports: [CampaignService],
})
export class CampaignModule {}
