import {
  Body,
  Controller,
  Get,
  HttpCode,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PlanGuard } from '../../common/guards/plan.guard';
import { RequirePlan } from '../../common/decorators/require-plan.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserService } from './user.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateFunnelDto } from './dto/update-funnel.dto';

@Controller('rise-review/profile')
@UseGuards(JwtAuthGuard, PlanGuard)
@RequirePlan('starter')
export class ProfileController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async getProfile(@CurrentUser() user: { id: number }) {
    const data = await this.userService.getProfile(user.id);
    return { success: true, data };
  }

  @Patch()
  async updateProfile(
    @CurrentUser() user: { id: number },
    @Body() dto: UpdateProfileDto,
  ) {
    const data = await this.userService.updateProfile(user.id, dto);
    return { success: true, message: 'Profile updated successfully', data };
  }

  @Patch('password')
  @HttpCode(200)
  async changePassword(
    @CurrentUser() user: { id: number },
    @Body() dto: ChangePasswordDto,
  ) {
    await this.userService.changePassword(
      user.id,
      dto.oldPassword,
      dto.newPassword,
    );
    return { success: true, message: 'Password changed successfully' };
  }

  @Patch('funnel')
  @HttpCode(200)
  async updateFunnelMessage(
    @CurrentUser() user: { id: number },
    @Body() dto: UpdateFunnelDto,
  ) {
    await this.userService.updateFunnelMessage(user.id, dto.channel, {
      initial: dto.initial,
      positive: dto.positive,
      negative: dto.negative,
    });
    return { success: true };
  }
}
