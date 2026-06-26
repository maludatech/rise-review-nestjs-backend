import { Controller, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { PlanGuard } from '../../../common/guards/plan.guard';

@Controller('rise-review/integrations/open-table')
@UseGuards(JwtAuthGuard, PlanGuard)
export class OpenTableController {}
