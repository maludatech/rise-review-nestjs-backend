import { Body, Controller, Get, HttpCode, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PlanGuard } from '../../common/guards/plan.guard';
import { RequirePlan } from '../../common/decorators/require-plan.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserService } from './user.service';
import { UpdateNotificationPreferencesDto } from './dto/update-notification-preferences.dto';

@Controller('rise-review/notifications')
@UseGuards(JwtAuthGuard, PlanGuard)
@RequirePlan('starter')
export class NotificationController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async getPreferences(@CurrentUser() user: { id: number }) {
    const data = await this.userService.getNotificationPreferences(user.id);
    return { success: true, data };
  }

  @Patch()
  @HttpCode(200)
  async updatePreferences(
    @CurrentUser() user: { id: number },
    @Body() dto: UpdateNotificationPreferencesDto,
  ) {
    const data = await this.userService.updateNotificationPreferences(
      user.id,
      dto,
    );
    return {
      success: true,
      message: 'Notification preferences saved',
      data,
    };
  }
}
