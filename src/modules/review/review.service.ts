import { Injectable, NotFoundException } from '@nestjs/common';
import { RiseReviewPrismaService } from '../prisma/rise-review/prisma.service';
import { ReviewRequestService } from '../review-request/review-request.service';

@Injectable()
export class ReviewService {
  constructor(
    private readonly prisma: RiseReviewPrismaService,
    private readonly reviewRequest: ReviewRequestService,
  ) {}

  async getReviews(userId: number, query: { page?: string; limit?: string }) {
    const limit = Math.min(Math.max(Number(query.limit ?? 50), 1), 200);
    const page = Math.max(Number(query.page ?? 1), 1);
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.review.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.review.count({ where: { userId } }),
    ]);

    return {
      data,
      page,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async syncReviews(userId: number) {
    const count = await this.reviewRequest.scrapeAndSaveReviews(userId);
    return { count };
  }

  async respondToReview(
    userId: number,
    reviewId: number,
    responseText: string,
  ) {
    const review = await this.prisma.review.findFirst({
      where: { id: reviewId, userId },
    });

    if (!review) throw new NotFoundException('Review not found');

    const updated = await this.prisma.review.update({
      where: { id: reviewId },
      data: { responded: true, responseText },
    });

    await this.prisma.activity.create({
      data: {
        userId,
        type: 'customer_reply',
        platform: review.source,
        preview: responseText,
        status: 'sent',
      },
    });

    return updated;
  }
}
