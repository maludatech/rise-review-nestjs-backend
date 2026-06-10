import { Injectable } from '@nestjs/common';
import { RiseReviewPrismaService } from '../../prisma/rise-review/prisma.service';

@Injectable()
export class CoverManagerService {
  constructor(private prisma: RiseReviewPrismaService) {}

  async fetchReservations(
    userId: number,
    dto: ConnectCoverManagerDto,
    persist = true,
  ) {
    const response = await fetch(
      'https://www.covermanager.com/api/clients/get_clients_reservs',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: dto.apiKey,
        },
        body: JSON.stringify({
          restaurant: dto.restaurantId,
        }),
      },
    );

    const data = await response.json();

    if (!Array.isArray(data.reservs)) {
      throw new BadRequestException('Invalid CoverManager credentials');
    }

    if (persist) {
      await this.persistReservations(userId, data.reservs);
    }

    return data.reservs;
  }
}
