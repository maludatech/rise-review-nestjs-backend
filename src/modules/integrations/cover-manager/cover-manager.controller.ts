import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { CoverManagerService } from './cover-manager.service';
import { CoverManagerDto } from './dto/cover-manager.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { PlanGuard } from '../../../common/guards/plan.guard';
import { RequirePlan } from '../../../common/decorators/require-plan.decorator';
import type { AuthenticatedRequest } from '../../../common/types/authenticated-request';

@Controller('integrations/covermanager')
@UseGuards(JwtAuthGuard, PlanGuard)
@RequirePlan('growth')
export class CoverManagerController {
  constructor(private readonly coverManagerService: CoverManagerService) {}

  @Post('reservations')
  async connect(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CoverManagerDto,
  ) {
    return this.coverManagerService.fetchReservations(req.user!.id, {
      ...dto,
      persist: true,
    });
  }

  @Get('reservations')
  async reservations(@Req() req: AuthenticatedRequest) {
    return this.coverManagerService.fetchReservations(req.user!.id, {
      persist: false,
    });
  }
}
