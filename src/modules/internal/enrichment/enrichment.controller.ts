import { Controller, Get, HttpCode, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { AdminGuard } from '../../../common/guards/admin.guard';
import { EnrichmentService } from './enrichment.service';

@Controller('internal/enrichment')
@UseGuards(JwtAuthGuard, AdminGuard)
export class EnrichmentController {
  constructor(private readonly enrichmentService: EnrichmentService) {}

  @Post('trigger')
  @HttpCode(200)
  async trigger() {
    this.enrichmentService.enrichPendingLeads().catch((err) =>
      console.error('Manual enrichment failed:', err),
    );
    return { message: 'Enrichment job started in background.' };
  }

  @Get('pending')
  async getPending() {
    const pending = await this.enrichmentService.getPendingCount();
    return { pending };
  }
}
