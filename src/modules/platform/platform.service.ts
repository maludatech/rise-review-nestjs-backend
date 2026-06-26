import { Injectable, NotFoundException } from '@nestjs/common';
import { RiseReviewPrismaService } from '../prisma/rise-review/prisma.service';
import type { OnboardingData } from '../../common/types/onboarding-data.type';

type PlatformMap = {
  coverManager?: { connected?: boolean; apiKey?: string; restaurant?: string };
  openTable?: {
    connected?: boolean;
    clientId?: string;
    clientSecret?: string;
    restaurantId?: string;
  };
  theFork?: { connected?: boolean };
  doctolib?: { connected?: boolean };
};

@Injectable()
export class PlatformService {
  constructor(private readonly prisma: RiseReviewPrismaService) {}

  async getPlatformStatus(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { onboardingData: true },
    });

    if (!user) throw new NotFoundException('User not found');

    const onboarding = user.onboardingData as OnboardingData | null;
    const platforms = (onboarding?.platform ?? {}) as PlatformMap;

    return {
      coverManager: {
        connected: platforms.coverManager?.connected ?? false,
        apiKey: Boolean(platforms.coverManager?.apiKey),
        restaurantId: platforms.coverManager?.restaurant ?? null,
      },
      openTable: {
        connected: platforms.openTable?.connected ?? false,
      },
      theFork: {
        connected: platforms.theFork?.connected ?? false,
      },
      doctolib: {
        connected: platforms.doctolib?.connected ?? false,
      },
    };
  }
}
