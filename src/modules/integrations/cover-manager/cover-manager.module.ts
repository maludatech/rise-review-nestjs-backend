import { Module } from '@nestjs/common';

import { CoverManagerController } from './cover-manager.controller';
import { CoverManagerService } from './cover-manager.service';

@Module({
  controllers: [CoverManagerController],
  providers: [CoverManagerService],
  exports: [CoverManagerService],
})
export class CoverManagerModule {}
