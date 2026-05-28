import { Module } from '@nestjs/common';
import { ReviewRequestService } from './review-request.service';
import { WhatsAppService } from './whatsapp.service';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [EmailModule],
  providers: [ReviewRequestService, WhatsAppService],
})
export class ReviewRequestModule {}
