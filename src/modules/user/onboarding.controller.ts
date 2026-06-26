import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PlanGuard } from '../../common/guards/plan.guard';
import { RequirePlan } from '../../common/decorators/require-plan.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserService } from './user.service';
import { OnboardingService } from './onboarding.service';
import { SaveOnboardingDto } from './dto/save-onboarding.dto';
import { StartVerificationDto } from './dto/start-verification.dto';
import { CheckVerificationDto } from './dto/check-verification.dto';

@Controller('rise-review/onboarding')
@UseGuards(JwtAuthGuard, PlanGuard)
@RequirePlan('starter')
export class OnboardingController {
  constructor(
    private readonly userService: UserService,
    private readonly onboardingService: OnboardingService,
  ) {}

  @Post()
  @HttpCode(200)
  async saveOnboarding(
    @CurrentUser() user: { id: number },
    @Body() dto: SaveOnboardingDto,
  ) {
    const onboardingData = await this.userService.saveOnboardingData(
      user.id,
      dto,
    );
    return { success: true, onboardingData };
  }

  @Post('verify/start')
  @HttpCode(200)
  async startVerification(
    @CurrentUser() user: { id: number },
    @Body() dto: StartVerificationDto,
  ) {
    const result = await this.onboardingService.startVerification(
      user.id,
      dto.business,
      dto.method,
    );
    return { success: true, ...result };
  }

  @Post('verify/check')
  @HttpCode(200)
  async checkVerification(
    @CurrentUser() user: { id: number },
    @Body() dto: CheckVerificationDto,
  ) {
    await this.onboardingService.checkVerification(user.id, dto.code);
    return { success: true, message: 'Business verified successfully.' };
  }

  @Post('verify/resend')
  @HttpCode(200)
  async resendVerification(@CurrentUser() user: { id: number }) {
    await this.onboardingService.resendVerification(user.id);
    return { success: true, message: 'Verification code resent' };
  }
}
