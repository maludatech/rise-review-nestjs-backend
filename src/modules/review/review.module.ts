import { Module } from '@nestjs/common';
import { ReviewService } from './review.service';
import { ReviewController } from './review.controller';
import { ReviewRequestModule } from '../review-request/review-request.module';

@Module({
  imports: [ReviewRequestModule],
  controllers: [ReviewController],
  providers: [ReviewService],
})
export class ReviewModule {}
