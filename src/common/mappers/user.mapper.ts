import { normalize } from './prisma-normalizer';

import type { User } from '../../generated/rise-review/client';
import type { UserSafe } from '../types/user-safe.type';
import type { TwilioIntegration } from '../types/twilio-integration.type';
import type { OnboardingData } from '../types/onboarding-data.type';

export function mapUser(user: User) {
  return {
    ...user,

    twilioIntegration: normalize<TwilioIntegration>(user.twilioIntegration),

    onboardingData: normalize<OnboardingData>(user.onboardingData),

    googleBusiness: normalize(user.googleBusiness),

    notificationPreferences: normalize(user.notificationPreferences),
  };
}

export function mapUserSafe(user: UserSafe): UserSafe {
  return {
    id: user.id,
    role: user.role,
    subscriptionStatus: user.subscriptionStatus,
    subscriptionPlan: user.subscriptionPlan,
    trialEndDate: user.trialEndDate,
  };
}
