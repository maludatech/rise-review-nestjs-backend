import { Module } from '@nestjs/common';
import { EmailTrackingController } from './email-tracking.controller';

@Module({
  controllers: [EmailTrackingController],
})
export class EmailTrackingModule {}
