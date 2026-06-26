import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PlanGuard } from '../../common/guards/plan.guard';
import { RequirePlan } from '../../common/decorators/require-plan.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PlatformService } from './platform.service';

@Controller('rise-review/platform')
@UseGuards(JwtAuthGuard, PlanGuard)
@RequirePlan('starter')
export class PlatformController {
  constructor(private readonly platformService: PlatformService) {}

  @Get()
  async getPlatformStatus(@CurrentUser() user: { id: number }) {
    return this.platformService.getPlatformStatus(user.id);
  }
}
