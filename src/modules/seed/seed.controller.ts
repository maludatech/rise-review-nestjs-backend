import { Controller, Post } from '@nestjs/common';
import { SeedService } from './seed.service';

@Controller('seed')
export class SeedController {
  constructor(private seedService: SeedService) {}

  @Post('seed-leads')
  seed() {
    return this.seedService.seedLeads();
  }
}
