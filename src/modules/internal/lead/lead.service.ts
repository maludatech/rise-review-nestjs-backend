import { Injectable } from '@nestjs/common';
import { InternalPrismaService } from '../../prisma/internal/prisma.service';
import { fetchGoogleRating } from '../../../common/helpers/google-rating.helper';
import { parseCSV } from '../../../common/helpers/csv-parser.helper';
import { normalizeRow } from '../../../common/helpers/row-normalizer.helper';
import { EnrichmentService } from '../enrichment/enrichment.service';

function pick(
  row: Record<string, unknown>,
  ...keys: string[]
): string | undefined {
  for (const k of keys) {
    const v = row[k];
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return undefined;
}

@Injectable()
export class LeadService {
  constructor(
    private readonly prisma: InternalPrismaService,
    private readonly enrichment: EnrichmentService,
  ) {}

  async createLead(
    adminId: number,
    dto: {
      businessName: string;
      email: string;
      city: string;
      industry?: string;
    },
  ) {
    const enriched = await fetchGoogleRating(dto.businessName, dto.city);

    return this.prisma.lead.create({
      data: {
        businessName: dto.businessName,
        email: dto.email,
        city: dto.city,
        industry: dto.industry,
        createdById: adminId,
        googleRating: enriched?.googleRating ?? null,
        reviewCount: enriched?.totalReviews ?? null,
        googlePlaceId: enriched?.googlePlaceId ?? null,
      },
    });
  }

  async getLeads(adminId: number) {
    return this.prisma.lead.findMany({
      where: { createdById: adminId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getStats() {
    const [totalLeads, enrichedLeads, emailsSent, emailsOpened] =
      await Promise.all([
        this.prisma.lead.count(),
        this.prisma.lead.count({ where: { isEnriched: true } }),
        this.prisma.lead.count({ where: { emailSent: true } }),
        this.prisma.lead.count({ where: { opened: true } }),
      ]);
    return { totalLeads, enrichedLeads, emailsSent, emailsOpened };
  }

  async getHistory(leadId: number) {
    return this.prisma.leadHistory.findMany({
      where: { leadId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async importCSV(adminId: number, filePath: string) {
    const rows = await parseCSV(filePath);
    const normalized = rows.map(normalizeRow);

    const docs = normalized
      .map((r) => {
        const businessName = pick(
          r,
          'businessname',
          'business_name',
          'business',
        );
        const email = pick(r, 'email', 'mail', 'e_mail');
        const city = pick(r, 'city', 'town');
        const industry = pick(r, 'industry', 'sector', 'niche');

        if (!businessName || !email || !city) return null;
        return { businessName, email, city, industry, createdById: adminId };
      })
      .filter((d): d is NonNullable<typeof d> => !!d);

    if (!docs.length) return { received: rows.length, parsed: 0, accepted: 0 };

    const unique = Array.from(
      new Map(docs.map((d) => [d.email.toLowerCase(), d])).values(),
    );

    const result = await this.prisma.lead.createMany({
      data: unique,
      skipDuplicates: true,
    });

    // Kick off enrichment in background
    this.enrichment.enrichPendingLeads(unique.length).catch(() => {});

    return {
      received: rows.length,
      parsed: docs.length,
      deduped: unique.length,
      accepted: result.count,
      skipped: rows.length - result.count,
    };
  }
}
