import { Module } from '@nestjs/common';
import { OpenTableController } from './open-table.controller';
import { OpenTableService } from './open-table.service';

@Module({
  controllers: [OpenTableController],
  providers: [OpenTableService],
  exports: [OpenTableService],
})
export class OpenTableModule {}
