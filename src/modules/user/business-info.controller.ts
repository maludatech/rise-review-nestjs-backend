import { BadRequestException, Body, Controller, Get, HttpCode, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PlanGuard } from '../../common/guards/plan.guard';
import { RequirePlan } from '../../common/decorators/require-plan.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserService } from './user.service';
import { UpdateBusinessInfoDto } from './dto/update-business-info.dto';

const READONLY_FIELDS = ['businessName', 'category', 'country', 'mapsLink'] as const;

@Controller('rise-review/business-info')
@UseGuards(JwtAuthGuard, PlanGuard)
@RequirePlan('starter')
export class BusinessInfoController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async getBusinessInfo(@CurrentUser() user: { id: number }) {
    const data = await this.userService.getBusinessInfo(user.id);
    return { success: true, data };
  }

  @Patch()
  @HttpCode(200)
  async updateBusinessInfo(
    @CurrentUser() user: { id: number },
    @Body() dto: UpdateBusinessInfoDto,
    @Body() raw: Record<string, unknown>,
  ) {
    const attempted = READONLY_FIELDS.filter((f) => f in raw);
    if (attempted.length > 0) {
      throw new BadRequestException(
        `Cannot update read-only fields: ${attempted.join(', ')}. Contact support to change these.`,
      );
    }

    const data = await this.userService.updateBusinessInfo(user.id, dto);
    return { success: true, message: 'Business information updated', data };
  }
}
