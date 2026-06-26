import { Module } from '@nestjs/common';
import { CoverManagerModule } from './cover-manager/cover-manager.module';
import { OpenTableModule } from './open-table/open-table.module';
import { TwilioModule } from './twilio/twilio.module';
import { IntegrationsController } from './integrations.controller';

@Module({
  imports: [CoverManagerModule, OpenTableModule, TwilioModule],
  controllers: [IntegrationsController],
})
export class IntegrationsModule {}
