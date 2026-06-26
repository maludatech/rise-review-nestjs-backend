import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { RiseReviewPrismaService } from '../../prisma/rise-review/prisma.service';
import type { OnboardingData } from '../../../common/types/onboarding-data.type';

const OPENTABLE_OAUTH = 'https://oauth.opentable.com/api/v2/oauth/token';
const OPENTABLE_API = 'https://api.opentable.com/v2';

interface OpenTableCustomer {
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
}

export interface OpenTableReservation {
  id: string;
  customer?: OpenTableCustomer;
  status?: string;
  comment?: string;
  date?: string;
  rating?: number;
}

type OpenTablePlatformCreds = {
  connected?: boolean;
  clientId?: string;
  clientSecret?: string;
  restaurantId?: string;
  accessToken?: string;
};

@Injectable()
export class OpenTableService {
  private readonly logger = new Logger(OpenTableService.name);

  constructor(private readonly prisma: RiseReviewPrismaService) {}

  // ── OAuth ─────────────────────────────────────────────────────────────────

  private async getOAuthToken(
    clientId: string,
    clientSecret: string,
  ): Promise<string> {
    const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const res = await fetch(OPENTABLE_OAUTH, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basic}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    if (!res.ok) {
      throw new BadRequestException(
        `OpenTable OAuth failed: ${res.status} ${res.statusText}`,
      );
    }

    const data = (await res.json()) as { access_token?: string };

    if (typeof data.access_token !== 'string') {
      throw new BadRequestException('Invalid OAuth response from OpenTable');
    }

    return data.access_token;
  }

  // ── Main fetch ────────────────────────────────────────────────────────────

  async fetchReservations(
    userId: number,
    opts: {
      clientId?: string;
      clientSecret?: string;
      restaurantId?: string;
      accessToken?: string;
      persist?: boolean;
    } = {},
  ): Promise<{
    reservations: OpenTableReservation[];
    persisted: number;
    reviewsSaved: number;
  }> {
    let { restaurantId, accessToken } = opts;
    const { clientId, clientSecret, persist = false } = opts;

    // Fall back to stored credentials if none provided
    if (!restaurantId || !accessToken) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { onboardingData: true },
      });

      const onboarding = user?.onboardingData as OnboardingData | null;
      const stored = (onboarding?.platform?.['openTable'] ??
        {}) as OpenTablePlatformCreds;

      restaurantId = restaurantId ?? stored.restaurantId;
      accessToken = accessToken ?? stored.accessToken;

      if (!accessToken && stored.clientId && stored.clientSecret) {
        accessToken = await this.getOAuthToken(
          stored.clientId,
          stored.clientSecret,
        );
      }
    }

    if (!restaurantId) {
      throw new BadRequestException('restaurantId is required');
    }

    // Get token from passed credentials if still not set
    if (!accessToken) {
      if (clientId && clientSecret) {
        accessToken = await this.getOAuthToken(clientId, clientSecret);
      } else {
        throw new BadRequestException('OpenTable credentials required');
      }
    }

    const apiRes = await fetch(
      `${OPENTABLE_API}/restaurants/${restaurantId}/reservations`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      },
    );

    if (!apiRes.ok) {
      throw new BadRequestException(
        `OpenTable API error: ${apiRes.status} ${apiRes.statusText}`,
      );
    }

    const raw = (await apiRes.json()) as {
      reservations?: OpenTableReservation[];
    };
    const reservations: OpenTableReservation[] = Array.isArray(raw.reservations)
      ? raw.reservations
      : [];

    let persisted = 0;
    let reviewsSaved = 0;

    if (persist && reservations.length) {
      persisted = await this.persistReservations(userId, reservations);
      reviewsSaved = await this.saveReviews(userId, reservations);
    }

    return { reservations, persisted, reviewsSaved };
  }

  // ── Connect (fetch + save credentials) ───────────────────────────────────

  async connect(
    userId: number,
    clientId: string,
    clientSecret: string,
    restaurantId: string,
  ) {
    const { reservations, persisted, reviewsSaved } =
      await this.fetchReservations(userId, {
        clientId,
        clientSecret,
        restaurantId,
        persist: true,
      });

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { onboardingData: true },
    });

    const onboarding = (user?.onboardingData ?? {}) as OnboardingData;

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        openTableConnected: true,
        onboardingData: JSON.parse(
          JSON.stringify({
            ...onboarding,
            platform: {
              ...(onboarding.platform ?? {}),
              openTable: {
                connected: true,
                clientId,
                clientSecret,
                restaurantId,
              },
            },
          }),
        ),
      },
    });

    return { connected: true, reservations, persisted, reviewsSaved };
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private async persistReservations(
    userId: number,
    reservations: OpenTableReservation[],
  ): Promise<number> {
    let persisted = 0;

    for (const r of reservations) {
      try {
        const customerName =
          [r.customer?.firstName, r.customer?.lastName]
            .filter(Boolean)
            .join(' ') ||
          r.customer?.phone ||
          'Unknown';

        const exists = await this.prisma.activity.findFirst({
          where: { userId, sourceId: r.id, platform: 'OpenTable' },
        });

        if (!exists) {
          await this.prisma.activity.create({
            data: {
              userId,
              type: 'reservation',
              sourceId: r.id,
              platform: 'OpenTable',
              customer: customerName,
              preview: r.comment ?? '',
              status: 'pending',
            },
          });

          // Upsert customer from reservation
          const phone = r.customer?.phone ?? null;
          const email = r.customer?.email ?? null;

          if (phone || email) {
            await this.prisma.customer.upsert({
              where: email
                ? { userId_email: { userId, email } }
                : { userId_phone: { userId, phone: phone! } },
              create: {
                userId,
                name: customerName,
                phone,
                email,
              },
              update: { name: customerName },
            });
          }

          persisted++;
        }
      } catch (err) {
        this.logger.warn(
          `OpenTable persist error for reservation ${r.id}`,
          err,
        );
      }
    }

    return persisted;
  }

  private async saveReviews(
    userId: number,
    reservations: OpenTableReservation[],
  ): Promise<number> {
    let saved = 0;

    for (const r of reservations) {
      const comment = r.comment ?? '';
      if (!comment.trim()) continue;

      const reviewerName =
        [r.customer?.firstName, r.customer?.lastName]
          .filter(Boolean)
          .join(' ') ||
        r.customer?.phone ||
        'Anonymous';

      const rating =
        typeof r.rating === 'number' && r.rating >= 1 && r.rating <= 5
          ? r.rating
          : 0;

      try {
        const existing = await this.prisma.review.findFirst({
          where: { userId, reviewerName, source: 'opentable', comment },
        });

        if (!existing) {
          await this.prisma.review.create({
            data: {
              userId,
              rating,
              comment,
              source: 'opentable',
              reviewerName,
              reviewDate: r.date ? new Date(r.date) : new Date(),
              responded: false,
              sentNotification: false,
            },
          });
          saved++;
        }
      } catch (err) {
        this.logger.warn(
          `OpenTable review save error for reviewer ${reviewerName}`,
          err,
        );
      }
    }

    return saved;
  }
}
