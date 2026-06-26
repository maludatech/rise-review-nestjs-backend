import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PlanGuard } from '../../common/guards/plan.guard';
import { RequirePlan } from '../../common/decorators/require-plan.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CampaignService } from './campaign.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';

@Controller('rise-review/campaigns')
@UseGuards(JwtAuthGuard, PlanGuard)
@RequirePlan('starter')
export class CampaignController {
  constructor(private readonly campaignService: CampaignService) {}

  @Get()
  async getCampaigns(@CurrentUser() user: { id: number }) {
    const data = await this.campaignService.getCampaigns(user.id);
    return { success: true, data };
  }

  @Get(':id')
  async getCampaignById(
    @CurrentUser() user: { id: number },
    @Param('id', ParseIntPipe) id: number,
  ) {
    const data = await this.campaignService.getCampaignById(user.id, id);
    return { success: true, data };
  }

  @Get(':id/verdicts')
  async getCampaignVerdicts(
    @CurrentUser() user: { id: number },
    @Param('id', ParseIntPipe) id: number,
  ) {
    const data = await this.campaignService.getCampaignVerdicts(user.id, id);
    return { success: true, data };
  }

  @Post()
  @HttpCode(201)
  async createCampaign(
    @CurrentUser() user: { id: number },
    @Body() dto: CreateCampaignDto,
  ) {
    const data = await this.campaignService.createCampaign(user.id, dto);
    return { success: true, data, campaignId: (data as { id: number }).id };
  }

  @Post(':id/start')
  @HttpCode(200)
  async startCampaign(
    @CurrentUser() user: { id: number },
    @Param('id', ParseIntPipe) id: number,
  ) {
    const data = await this.campaignService.startCampaign(user.id, id);
    return { success: true, data };
  }

  @Post(':id/pause')
  @HttpCode(200)
  async pauseCampaign(
    @CurrentUser() user: { id: number },
    @Param('id', ParseIntPipe) id: number,
  ) {
    const data = await this.campaignService.pauseCampaign(user.id, id);
    return { success: true, data };
  }

  @Post(':id/resume')
  @HttpCode(200)
  async resumeCampaign(
    @CurrentUser() user: { id: number },
    @Param('id', ParseIntPipe) id: number,
  ) {
    const data = await this.campaignService.resumeCampaign(user.id, id);
    return { success: true, data };
  }

  @Patch(':id')
  async updateCampaign(
    @CurrentUser() user: { id: number },
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCampaignDto,
  ) {
    const data = await this.campaignService.updateCampaign(user.id, id, dto);
    return { success: true, data };
  }

  @Delete(':id')
  async deleteCampaign(
    @CurrentUser() user: { id: number },
    @Param('id', ParseIntPipe) id: number,
  ) {
    await this.campaignService.deleteCampaign(user.id, id);
    return { success: true, message: 'Campaign deleted successfully' };
  }
}
