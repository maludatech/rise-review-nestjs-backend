import { Global, Module } from '@nestjs/common';
import { RiseReviewPrismaService } from './prisma.service';

@Global()
@Module({
  providers: [RiseReviewPrismaService],
  exports: [RiseReviewPrismaService],
})
export class RiseReviewPrismaModule {}
