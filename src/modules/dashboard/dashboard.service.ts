import { Injectable } from '@nestjs/common';
import { RiseReviewPrismaService } from '../prisma/rise-review/prisma.service';
import type { Activity } from '../../generated/rise-review/client';

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: RiseReviewPrismaService) {}

  async getStats(userId: number) {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const [agg, respondedCount, thisMonthCount, lastMonthCount] =
      await Promise.all([
        this.prisma.review.aggregate({
          where: { userId },
          _avg: { rating: true },
          _count: { id: true },
        }),
        this.prisma.review.count({ where: { userId, responded: true } }),
        this.prisma.review.count({
          where: { userId, createdAt: { gte: monthStart } },
        }),
        this.prisma.review.count({
          where: {
            userId,
            createdAt: { gte: lastMonthStart, lte: lastMonthEnd },
          },
        }),
      ]);

    const totalReviews = agg._count.id;
    const avgRating = agg._avg.rating ? Number(agg._avg.rating.toFixed(1)) : 0;
    const responseRate =
      totalReviews > 0 ? Math.round((respondedCount / totalReviews) * 100) : 0;
    const reviewsTrend =
      lastMonthCount > 0
        ? Math.round(((thisMonthCount - lastMonthCount) / lastMonthCount) * 100)
        : thisMonthCount > 0
          ? 100
          : 0;

    return {
      averageRating: avgRating,
      totalReviews,
      responseRate,
      reviewsTrend,
    };
  }

  async getChartData(userId: number, range: string) {
    const now = new Date();
    let startDate: Date;

    switch (range) {
      case '7d':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 6);
        break;
      case '30d':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 29);
        break;
      case '3m':
        startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        break;
      case '6m':
      default:
        startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
        break;
    }

    const reviews = await this.prisma.review.findMany({
      where: { userId, createdAt: { gte: startDate } },
      select: { rating: true, createdAt: true },
    });

    const byDay = range === '7d' || range === '30d';
    const grouped: Record<string, { positive: number; negative: number }> = {};

    for (const r of reviews) {
      const key = byDay
        ? `Day ${r.createdAt.getDate()}`
        : MONTHS[r.createdAt.getMonth()];

      if (!grouped[key]) grouped[key] = { positive: 0, negative: 0 };
      if (r.rating >= 4) grouped[key].positive++;
      else grouped[key].negative++;
    }

    return Object.entries(grouped).map(([month, counts]) => ({
      month,
      ...counts,
    }));
  }

  async getRecentActivities(
    userId: number,
    query: { type?: string; limit?: string; page?: string },
  ) {
    const limit = Math.min(Number(query.limit ?? 20), 100);
    const page = Math.max(Number(query.page ?? 1), 1);

    const activities = await this.prisma.activity.findMany({
      where: {
        userId,
        ...(query.type ? { type: query.type as Activity['type'] } : {}),
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return activities.map((a) => ({
      id: a.id,
      type: a.type,
      label: this.buildLabel(a),
      preview: a.preview,
      customer: a.customer,
      platform: a.platform,
      rating: a.rating,
      status: a.status,
      createdAt: a.createdAt,
    }));
  }

  async createActivity(
    userId: number,
    data: {
      type: Activity['type'];
      sourceId?: string;
      platform?: string;
      customer?: string;
      rating?: string;
      preview?: string;
      status?: Activity['status'];
    },
  ) {
    return this.prisma.activity.create({
      data: { userId, ...data },
    });
  }

  async getCampaignBreakdown(userId: number, range: string) {
    const now = new Date();
    const fromDate = new Date();

    switch (range) {
      case '7d':
        fromDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        fromDate.setDate(now.getDate() - 30);
        break;
      case '3m':
        fromDate.setMonth(now.getMonth() - 3);
        break;
      case '6m':
      default:
        fromDate.setMonth(now.getMonth() - 6);
        break;
    }

    const campaigns = await this.prisma.campaign.findMany({
      where: { userId, createdAt: { gte: fromDate } },
      select: { sent: true, opened: true, responded: true, status: true },
    });

    return {
      total: campaigns.length,
      sent: campaigns.reduce((acc, c) => acc + c.sent, 0),
      opened: campaigns.reduce((acc, c) => acc + c.opened, 0),
      replied: campaigns.reduce((acc, c) => acc + c.responded, 0),
      active: campaigns.filter((c) => c.status === 'pending').length,
      completed: campaigns.filter((c) => c.status === 'sent').length,
    };
  }

  private buildLabel(a: Activity): string {
    switch (a.type) {
      case 'message_sent':
        return `Automated message sent via ${a.platform ?? 'unknown'}`;
      case 'customer_reply':
        return `Reply received from ${a.customer ?? 'customer'}`;
      case 'ai_response':
        return 'AI auto-response generated';
      case 'review':
        return `New ${a.platform ?? 'platform'} review (${a.rating ?? 'N/A'}★)`;
      case 'system':
        return 'System update';
      default:
        return 'Activity';
    }
  }
}
