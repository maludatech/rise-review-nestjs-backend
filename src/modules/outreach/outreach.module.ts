import { Module } from '@nestjs/common';
import { OutreachService } from './outreach.service';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [EmailModule],
  providers: [OutreachService],
  exports: [OutreachService],
})
export class OutreachModule {}
