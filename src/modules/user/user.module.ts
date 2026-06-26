import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { OnboardingService } from './onboarding.service';
import { ProfileController } from './profile.controller';
import { OnboardingController } from './onboarding.controller';
import { BusinessInfoController } from './business-info.controller';
import { NotificationController } from './notification.controller';

@Module({
  controllers: [
    ProfileController,
    OnboardingController,
    BusinessInfoController,
    NotificationController,
  ],
  providers: [UserService, OnboardingService],
  exports: [UserService],
})
export class UserModule {}
