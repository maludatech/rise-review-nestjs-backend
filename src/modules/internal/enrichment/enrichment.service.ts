import { Injectable, Logger } from '@nestjs/common';
import { InternalPrismaService } from '../../prisma/internal/prisma.service';
import { fetchGoogleRating } from '../../../common/helpers/google-rating.helper';

const ENRICH_DELAY_MS = 1200;

@Injectable()
export class EnrichmentService {
  private readonly logger = new Logger(EnrichmentService.name);

  constructor(private readonly prisma: InternalPrismaService) {}

  async enrichPendingLeads(limit = 10) {
    const leads = await this.prisma.lead.findMany({
      where: { isEnriched: false },
      take: limit,
    });

    if (!leads.length) return { enriched: 0, skipped: 0 };

    let enriched = 0;
    let skipped = 0;

    for (const lead of leads) {
      try {
        const result = await fetchGoogleRating(lead.businessName, lead.city);

        if (!result) {
          skipped++;
          continue;
        }

        await this.prisma.lead.update({
          where: { id: lead.id },
          data: {
            googleRating: result.googleRating,
            reviewCount: result.totalReviews,
            googlePlaceId: result.googlePlaceId,
            isEnriched: true,
          },
        });

        enriched++;
      } catch (err) {
        this.logger.error(`Enrichment failed for lead ${lead.id}`, err);
        skipped++;
      }

      await new Promise((r) => setTimeout(r, ENRICH_DELAY_MS));
    }

    return { enriched, skipped };
  }

  async getPendingCount() {
    return this.prisma.lead.count({ where: { isEnriched: false } });
  }
}
