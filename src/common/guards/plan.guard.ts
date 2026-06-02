import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RiseReviewPrismaService } from '../../prisma/rise-review/prisma.service';
import { mapUserSafe } from '../mappers/user.mapper';
import { REQUIRE_PLAN_KEY, Plan } from '../decorators/require-plan.decorator';
import type { UserSafe } from '../types/user-safe.type';
import { AuthenticatedRequest } from '../types/authenticated-request';

const PLAN_RANK: Record<Plan, number> = {
  starter: 0,
  growth: 1,
  enterprise: 2,
};

@Injectable()
export class PlanGuard implements CanActivate {
  constructor(
    private prisma: RiseReviewPrismaService,
    private reflector: Reflector,
  ) {}

  private isAccessActive(user: {
    subscriptionStatus: string;
    trialEndDate?: Date | string | null;
  }): boolean {
    if (user.subscriptionStatus === 'active') return true;

    if (user.subscriptionStatus === 'trialing') {
      if (!user.trialEndDate) return false;
      return new Date(user.trialEndDate) > new Date();
    }

    return false;
  }

  private effectivePlan(user: UserSafe): Plan {
    if (
      user.subscriptionStatus === 'trialing' &&
      user.trialEndDate &&
      new Date(user.trialEndDate) > new Date()
    ) {
      return 'growth';
    }

    return user.subscriptionPlan ?? 'starter';
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPlan =
      this.reflector.getAllAndOverride<Plan>(REQUIRE_PLAN_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? 'starter';

    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();

    const userId = req.user?.id;
    const role = req.user?.role;

    if (!userId) throw new UnauthorizedException();

    const rawUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        subscriptionStatus: true,
        subscriptionPlan: true,
        trialEndDate: true,
        role: true,
        id: true,
      },
    });

    if (!rawUser) throw new UnauthorizedException('User not found');

    const user = mapUserSafe(rawUser);

    // admin bypass
    if (role === 'admin') {
      req.userDoc = user;
      return true;
    }

    const plan = this.effectivePlan(user);
    const planRank = PLAN_RANK[plan];
    const requiredRank = PLAN_RANK[requiredPlan];

    if (!this.isAccessActive(user) && requiredPlan !== 'starter') {
      throw new ForbiddenException({
        message: 'Your subscription is inactive. Please upgrade.',
        code: 'SUBSCRIPTION_INACTIVE',
      });
    }

    if (planRank < requiredRank) {
      throw new ForbiddenException({
        message: `This feature requires ${requiredPlan} plan or higher.`,
        code: 'PLAN_LIMIT_EXCEEDED',
      });
    }

    req.userDoc = user;
    return true;
  }
}
