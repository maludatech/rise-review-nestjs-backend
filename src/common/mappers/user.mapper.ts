import type { UserSafe } from '../types/user-safe.type';

export function mapUserSafe(user: UserSafe): UserSafe {
  return {
    id: user.id,
    role: user.role,
    subscriptionStatus: user.subscriptionStatus,
    subscriptionPlan: user.subscriptionPlan,
    trialEndDate: user.trialEndDate,
  };
}
