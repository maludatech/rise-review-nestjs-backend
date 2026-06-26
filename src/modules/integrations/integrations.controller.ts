import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  Logger,
  NotFoundException,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PlanGuard } from '../../common/guards/plan.guard';
import { RequirePlan } from '../../common/decorators/require-plan.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RiseReviewPrismaService } from '../prisma/rise-review/prisma.service';
import { CoverManagerService } from './cover-manager/cover-manager.service';
import { OpenTableService } from './open-table/open-table.service';
import type { OnboardingData } from '../../common/types/onboarding-data.type';

// JSON.parse always returns `any`; this helper preserves intent without unsafe-assignment suppression
function deepClone<T>(val: T): T {
  return JSON.parse(JSON.stringify(val)) as T;
}

const VALID_PLATFORMS = ['coverManager', 'openTable'] as const;
type ValidPlatform = (typeof VALID_PLATFORMS)[number];

@Controller('rise-review/integrations')
@UseGuards(JwtAuthGuard, PlanGuard)
@RequirePlan('growth')
export class IntegrationsController {
  private readonly logger = new Logger(IntegrationsController.name);

  constructor(
    private readonly prisma: RiseReviewPrismaService,
    private readonly coverManager: CoverManagerService,
    private readonly openTable: OpenTableService,
  ) {}

  @Post()
  @HttpCode(200)
  async saveCredentials(
    @CurrentUser() user: { id: number },
    @Body() body: { platform: string; credentials: Record<string, string> },
  ) {
    const { platform, credentials } = body;

    if (!platform || !credentials) {
      throw new BadRequestException('Platform and credentials required');
    }
    if (!VALID_PLATFORMS.includes(platform as ValidPlatform)) {
      throw new BadRequestException('Invalid or unsupported platform');
    }

    const dbUser = await this.prisma.user.findUnique({
      where: { id: user.id },
    });
    if (!dbUser) throw new NotFoundException('User not found');

    const onboarding = (dbUser.onboardingData ?? {}) as OnboardingData;

    let platformData: Record<string, unknown>;

    switch (platform as ValidPlatform) {
      case 'coverManager': {
        const { apiKey, restaurant } = credentials;
        if (!apiKey || !restaurant) {
          throw new BadRequestException(
            'CoverManager apiKey and restaurant required',
          );
        }
        platformData = { apiKey, restaurant };

        try {
          await this.coverManager.fetchReservations(user.id, {
            apiKey,
            restaurantId: restaurant,
            persist: false,
          });
        } catch (err: unknown) {
          throw new BadRequestException(
            err instanceof Error
              ? err.message
              : 'Connection failed. Please check your credentials.',
          );
        }

        await this.prisma.user.update({
          where: { id: user.id },
          data: {
            covermanagerConnected: true,
            onboardingData: deepClone({
              ...onboarding,
              platform: {
                ...(onboarding.platform ?? {}),
                coverManager: {
                  ...platformData,
                  connected: true,
                  connectedAt: new Date().toISOString(),
                },
              },
            }),
          },
        });
        break;
      }

      case 'openTable': {
        const { clientId, clientSecret, restaurantId } = credentials;
        if (!clientId || !clientSecret || !restaurantId) {
          throw new BadRequestException(
            'OpenTable clientId, clientSecret and restaurantId required',
          );
        }

        try {
          // connect() tests the connection, persists reservations, saves credentials, and sets the flag
          await this.openTable.connect(
            user.id,
            clientId,
            clientSecret,
            restaurantId,
          );
        } catch (err: unknown) {
          throw new BadRequestException(
            err instanceof Error
              ? err.message
              : 'Connection failed. Please check your credentials.',
          );
        }
        break;
      }
    }

    return { success: true, connected: true };
  }

  @Post('disconnect')
  @HttpCode(200)
  async disconnectPlatform(
    @CurrentUser() user: { id: number },
    @Body() body: { platform: string },
  ) {
    const { platform } = body;

    if (!VALID_PLATFORMS.includes(platform as ValidPlatform)) {
      throw new BadRequestException('Invalid or unsupported platform');
    }

    const dbUser = await this.prisma.user.findUnique({
      where: { id: user.id },
    });
    if (!dbUser) throw new NotFoundException('User not found');

    const onboarding = (dbUser.onboardingData ?? {}) as OnboardingData;
    const platforms = onboarding.platform ?? {};

    if (!platforms[platform])
      throw new NotFoundException('Platform not connected');

    const updatedPlatforms = { ...platforms, [platform]: { connected: false } };

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        covermanagerConnected:
          platform === 'coverManager' ? false : dbUser.covermanagerConnected,
        openTableConnected:
          platform === 'openTable' ? false : dbUser.openTableConnected,
        // JSON.parse returns any, which Prisma's InputJsonValue accepts
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        onboardingData: JSON.parse(
          JSON.stringify({ ...onboarding, platform: updatedPlatforms }),
        ),
      },
    });

    return { success: true, connected: false };
  }
}
