import { SetMetadata } from '@nestjs/common';

export const REQUIRE_PLAN_KEY = 'require_plan';

export type Plan = 'starter' | 'growth' | 'enterprise';

export const RequirePlan = (plan: Plan) => SetMetadata(REQUIRE_PLAN_KEY, plan);
