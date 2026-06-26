import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PlanGuard } from '../../common/guards/plan.guard';
import { RequirePlan } from '../../common/decorators/require-plan.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { FeedbackService } from './feedback.service';
import { SubmitFeedbackDto } from './dto/submit-feedback.dto';
import { GetFeedbackQueryDto } from './dto/get-feedback-query.dto';

@Controller('rise-review/feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  // Public — customer submits after tapping 😞 link
  @Post()
  @HttpCode(201)
  async submitFeedback(@Body() dto: SubmitFeedbackDto) {
    await this.feedbackService.submitFeedback(dto.t, dto.message);
    return { success: true, message: 'Feedback submitted successfully.' };
  }

  @Get('unread-count')
  @UseGuards(JwtAuthGuard, PlanGuard)
  @RequirePlan('starter')
  async getUnreadCount(@CurrentUser() user: { id: number }) {
    const count = await this.feedbackService.getUnreadCount(user.id);
    return { success: true, count };
  }

  @Get()
  @UseGuards(JwtAuthGuard, PlanGuard)
  @RequirePlan('starter')
  async getFeedback(
    @CurrentUser() user: { id: number },
    @Query() query: GetFeedbackQueryDto,
  ) {
    const data = await this.feedbackService.getFeedback(user.id, query);
    return { success: true, data };
  }

  // read-all must be declared before :id/read to avoid route collision
  @Patch('read-all')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard, PlanGuard)
  @RequirePlan('starter')
  async markAllRead(@CurrentUser() user: { id: number }) {
    await this.feedbackService.markAllRead(user.id);
    return { success: true };
  }

  @Patch(':id/read')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard, PlanGuard)
  @RequirePlan('starter')
  async markRead(
    @CurrentUser() user: { id: number },
    @Param('id', ParseIntPipe) id: number,
  ) {
    const data = await this.feedbackService.markRead(user.id, id);
    return { success: true, data };
  }
}
