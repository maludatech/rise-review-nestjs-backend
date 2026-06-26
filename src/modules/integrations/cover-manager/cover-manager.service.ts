import { BadRequestException, Injectable } from '@nestjs/common';
import { RiseReviewPrismaService } from '../../prisma/rise-review/prisma.service';

interface CoverManagerReservation {
  id_reserv: string;
  id_restaurant: string;
  user_name?: string;
  user_phone?: string;
  commentary_restaurant?: string;
  commentary_client?: string;
  status?: string;
}

interface CoverManagerResponse {
  resp?: string;
  reservs?: CoverManagerReservation[];
  error?: string;
}

@Injectable()
export class CoverManagerService {
  constructor(private readonly prisma: RiseReviewPrismaService) {}

  private async fetchApi(
    apiKey: string,
    restaurantId: string,
    user_email?: string,
    user_phone?: string,
  ): Promise<CoverManagerResponse> {
    const response = await fetch(
      'https://www.covermanager.com/api/clients/get_clients_reservs',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: apiKey,
        },
        body: JSON.stringify({
          restaurant: restaurantId,
          user_email: user_email ?? '',
          user_phone: user_phone ?? '',
        }),
      },
    );

    return (await response.json()) as CoverManagerResponse;
  }

  async fetchReservations(
    userId: number,
    opts?: {
      apiKey?: string;
      restaurantId?: string;
      user_email?: string;
      user_phone?: string;
      persist?: boolean;
    },
  ) {
    let apiKey = opts?.apiKey;
    let restaurantId = opts?.restaurantId;

    if (!apiKey || !restaurantId) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          onboardingData: true,
        },
      });

      const onboarding = user?.onboardingData as {
        platform?: {
          coverManager?: { apiKey?: string; restaurantId?: string };
        };
      } | null;

      apiKey = apiKey ?? onboarding?.platform?.coverManager?.apiKey;

      restaurantId =
        restaurantId ?? onboarding?.platform?.coverManager?.restaurantId;
    }

    if (!apiKey || !restaurantId) {
      throw new BadRequestException('CoverManager credentials not available');
    }

    const raw = await this.fetchApi(
      apiKey,
      restaurantId,
      opts?.user_email,
      opts?.user_phone,
    );

    if (raw.resp === 'error' || raw.error || !Array.isArray(raw.reservs)) {
      throw new BadRequestException('Invalid CoverManager credentials');
    }

    let persisted = 0;
    let reviewsSaved = 0;

    if (opts?.persist) {
      for (const reservation of raw.reservs) {
        const exists = await this.prisma.activity.findFirst({
          where: {
            userId,
            sourceId: reservation.id_reserv,
            platform: 'CoverManager',
          },
        });

        if (!exists) {
          await this.prisma.activity.create({
            data: {
              userId,
              type: 'reservation',
              sourceId: reservation.id_reserv,
              platform: 'CoverManager',
              customer:
                reservation.user_name ?? reservation.user_phone ?? 'Unknown',
              preview:
                reservation.commentary_client ??
                reservation.commentary_restaurant ??
                '',
              status: 'pending',
            },
          });

          persisted++;
        }

        const comment =
          reservation.commentary_client ??
          reservation.commentary_restaurant ??
          '';

        if (!comment.trim()) continue;

        try {
          await this.prisma.review.create({
            data: {
              userId,
              rating: 0,
              comment,
              source: 'covermanager',
              reviewerName:
                reservation.user_name ?? reservation.user_phone ?? 'Anonymous',
              reviewDate: new Date(),
            },
          });

          reviewsSaved++;
        } catch {
          // duplicate review
        }
      }
    }

    return {
      clients: raw.reservs.map((r) => ({
        id: r.id_reserv,
        name: r.user_name ?? r.user_phone ?? 'Unknown',
      })),
      persisted,
      reviewsSaved,
    };
  }
}
