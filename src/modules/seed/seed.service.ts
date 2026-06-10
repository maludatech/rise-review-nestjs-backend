import { Injectable } from '@nestjs/common';
import { InternalPrismaService as PrismaService } from '../prisma/internal/prisma.service';
import { OutreachService } from '../outreach/outreach.service';
import { enrichPendingLeads } from '../leads/enrichment.service';

@Injectable()
export class SeedService {
  constructor(
    private prisma: PrismaService,
    private outreachService: OutreachService,
  ) {}

  async seedLeads() {
    const testLeads = [
      {
        businessName: 'Maludatech Services',
        email: 'maludatech@gmail.com',
        city: 'Lagos',
      },
      {
        businessName: 'Skyline Bistro',
        email: 'skyline@test.com',
        city: 'Abuja',
      },
      { businessName: 'Urban Trends', email: 'urban@test.com', city: 'Lagos' },
    ];

    const leads = await this.prisma.lead.createMany({
      data: testLeads.map((l) => ({
        ...l,
        createdById: 1,
      })),
    });

    await enrichPendingLeads();
    await this.outreachService.sendOutreachEmails();

    return leads;
  }
}
