import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RiseReviewPrismaService } from '../prisma/rise-review/prisma.service';
import { verifyReviewToken } from '../../common/helpers/review-token.helper';

@Injectable()
export class FeedbackService {
  constructor(private readonly prisma: RiseReviewPrismaService) {}

  async submitFeedback(token: string, message: string) {
    let payload: ReturnType<typeof verifyReviewToken>;

    try {
      payload = verifyReviewToken(token);
    } catch {
      throw new BadRequestException('This link has expired or is invalid.');
    }

    if (payload.verdict !== 'negative') {
      throw new BadRequestException('Invalid feedback token.');
    }

    const { userId, customerId, channel } = payload;

    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
    });

    await this.prisma.feedback.create({
      data: {
        userId,
        customerId: customer?.id ?? null,
        customerName: customer?.name ?? null,
        customerPhone: customer?.phone ?? null,
        customerEmail: customer?.email ?? null,
        channel: channel,
        message: message.trim(),
        read: false,
      },
    });
  }

  async getFeedback(
    userId: number,
    query: { limit?: string; unread?: string },
  ) {
    const limit = Math.min(Number(query.limit ?? 50), 200);

    return this.prisma.feedback.findMany({
      where: {
        userId,
        ...(query.unread === 'true' ? { read: false } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async getUnreadCount(userId: number) {
    return this.prisma.feedback.count({ where: { userId, read: false } });
  }

  async markRead(userId: number, id: number) {
    const feedback = await this.prisma.feedback.findFirst({
      where: { id, userId },
    });
    if (!feedback) throw new NotFoundException('Feedback not found.');
    return this.prisma.feedback.update({ where: { id }, data: { read: true } });
  }

  async markAllRead(userId: number) {
    await this.prisma.feedback.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
  }
}
