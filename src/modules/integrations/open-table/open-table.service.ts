import { Injectable } from '@nestjs/common';
import { RiseReviewPrismaService } from '../../prisma/rise-review/prisma.service';

@Injectable()
export class OpenTableService {
  constructor(private readonly prisma: RiseReviewPrismaService) {}
}
