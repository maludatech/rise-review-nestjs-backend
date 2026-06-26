import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PlanGuard } from '../../common/guards/plan.guard';
import { RequirePlan } from '../../common/decorators/require-plan.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ReviewService } from './review.service';
import { GetReviewsQueryDto } from './dto/get-reviews-query.dto';
import { RespondToReviewDto } from './dto/respond-to-review.dto';

@Controller('rise-review/reviews')
@UseGuards(JwtAuthGuard, PlanGuard)
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Get()
  @RequirePlan('starter')
  async getReviews(
    @CurrentUser() user: { id: number },
    @Query() query: GetReviewsQueryDto,
  ) {
    const result = await this.reviewService.getReviews(user.id, query);
    return { success: true, ...result };
  }

  @Post('sync')
  @HttpCode(200)
  @RequirePlan('growth')
  async syncReviews(@CurrentUser() user: { id: number }) {
    const { count } = await this.reviewService.syncReviews(user.id);
    return { success: true, message: 'Sync completed', count };
  }

  @Post('respond')
  @HttpCode(200)
  @RequirePlan('starter')
  async respondToReview(
    @CurrentUser() user: { id: number },
    @Body() dto: RespondToReviewDto,
  ) {
    const review = await this.reviewService.respondToReview(
      user.id,
      dto.reviewId,
      dto.response,
    );
    return { success: true, message: 'Response saved', review };
  }
}
