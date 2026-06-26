import { Module } from '@nestjs/common';
import { ReviewResponseService } from './review-response.service';
import { ReviewResponseController } from './review-response.controller';
import { EmailModule } from '../email/email.module';
import { ReviewRequestModule } from '../review-request/review-request.module';

@Module({
  imports: [EmailModule, ReviewRequestModule],
  controllers: [ReviewResponseController],
  providers: [ReviewResponseService],
})
export class ReviewResponseModule {}
