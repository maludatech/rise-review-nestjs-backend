import { Global, Module } from '@nestjs/common';
import { InternalPrismaService } from './prisma.service';

@Global()
@Module({
  providers: [InternalPrismaService],
  exports: [InternalPrismaService],
})
export class PrismaModule {}
