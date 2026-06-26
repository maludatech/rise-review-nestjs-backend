import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { PlanGuard } from '../../../common/guards/plan.guard';
import { RequirePlan } from '../../../common/decorators/require-plan.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { OpenTableService } from './open-table.service';

@Controller('rise-review/integrations/open-table')
@UseGuards(JwtAuthGuard, PlanGuard)
@RequirePlan('growth')
export class OpenTableController {
  constructor(private readonly openTableService: OpenTableService) {}

  // Connect: POST credentials + fetch + persist reservations
  @Post('reservations')
  @HttpCode(200)
  async connect(
    @CurrentUser() user: { id: number },
    @Body()
    body: {
      clientId?: string;
      clientSecret?: string;
      restaurantId?: string;
    },
  ) {
    const { clientId, clientSecret, restaurantId } = body;

    if (!restaurantId) {
      throw new BadRequestException('restaurantId is required');
    }

    const result = await this.openTableService.connect(
      user.id,
      clientId ?? '',
      clientSecret ?? '',
      restaurantId,
    );

    return { success: true, ...result };
  }

  // Read: GET stored reservations (uses saved credentials)
  @Get('reservations')
  async getReservations(@CurrentUser() user: { id: number }) {
    const result = await this.openTableService.fetchReservations(user.id, {
      persist: false,
    });

    return { success: true, connected: true, ...result };
  }
}
