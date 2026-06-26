import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { LeadService } from './lead.service';
import { LeadController } from './lead.controller';
import { EnrichmentModule } from '../enrichment/enrichment.module';

@Module({
  imports: [MulterModule.register({ dest: './uploads' }), EnrichmentModule],
  controllers: [LeadController],
  providers: [LeadService],
})
export class LeadModule {}
