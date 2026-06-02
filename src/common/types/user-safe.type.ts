import type {
  SubscriptionPlan,
  SubscriptionStatus,
  Role,
} from '../../generated/rise-review/client';

export type UserSafe = {
  id: number;
  role: Role;

  subscriptionStatus: SubscriptionStatus;
  subscriptionPlan: SubscriptionPlan | null;
  trialEndDate: Date | null;
};
