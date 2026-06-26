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
import { DashboardService } from './dashboard.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import type { Activity } from '../../generated/rise-review/client';

@Controller('rise-review/dashboard')
@UseGuards(JwtAuthGuard, PlanGuard)
@RequirePlan('starter')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  async getStats(@CurrentUser() user: { id: number }) {
    return this.dashboardService.getStats(user.id);
  }

  @Get('chart')
  async getChartData(
    @CurrentUser() user: { id: number },
    @Query('range') range = '6m',
  ) {
    return this.dashboardService.getChartData(user.id, range);
  }

  @Get('recent-activities')
  async getRecentActivities(
    @CurrentUser() user: { id: number },
    @Query('type') type?: string,
    @Query('limit') limit?: string,
    @Query('page') page?: string,
  ) {
    const data = await this.dashboardService.getRecentActivities(user.id, {
      type,
      limit,
      page,
    });
    return { success: true, data };
  }

  @Post('activities')
  @HttpCode(201)
  async createActivity(
    @CurrentUser() user: { id: number },
    @Body() dto: CreateActivityDto,
  ) {
    const data = await this.dashboardService.createActivity(user.id, {
      type: dto.type as Activity['type'],
      sourceId: dto.sourceId,
      platform: dto.platform,
      customer: dto.customer,
      rating: dto.rating,
      preview: dto.preview,
      status: dto.status as Activity['status'] | undefined,
    });
    return { success: true, data };
  }

  @Get('campaigns-breakdown')
  async getCampaignBreakdown(
    @CurrentUser() user: { id: number },
    @Query('range') range = '6m',
  ) {
    return this.dashboardService.getCampaignBreakdown(user.id, range);
  }
}
