import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { parse } from 'csv-parse/sync';
import { RiseReviewPrismaService } from '../prisma/rise-review/prisma.service';
import type { CreateCustomerDto } from './dto/create-customer.dto';

const STARTER_CUSTOMER_LIMIT = 50;

@Injectable()
export class CustomerService {
  constructor(private readonly prisma: RiseReviewPrismaService) {}

  // ── Plan helper ────────────────────────────────────────────────────────────

  private async isStarterUser(userId: number): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        subscriptionPlan: true,
        subscriptionStatus: true,
        trialEndDate: true,
      },
    });

    if (!user) return true;

    if (
      user.subscriptionStatus === 'trialing' &&
      user.trialEndDate &&
      new Date(user.trialEndDate) > new Date()
    ) {
      return false; // active trial = growth access
    }

    return !user.subscriptionPlan || user.subscriptionPlan === 'starter';
  }

  // ── CRUD ──────────────────────────────────────────────────────────────────

  async createCustomer(userId: number, dto: CreateCustomerDto) {
    if (await this.isStarterUser(userId)) {
      const count = await this.prisma.customer.count({ where: { userId } });
      if (count >= STARTER_CUSTOMER_LIMIT) {
        throw new ForbiddenException({
          message: `Starter plan is limited to ${STARTER_CUSTOMER_LIMIT} customers. Upgrade to Growth for unlimited customers.`,
          code: 'CUSTOMER_LIMIT_EXCEEDED',
        });
      }
    }

    return this.prisma.customer.create({
      data: {
        userId,
        name: dto.name,
        email: dto.email ?? null,
        phone: dto.phone ?? null,
      },
    });
  }

  async getCustomers(
    userId: number,
    query: { page?: string; limit?: string; search?: string },
  ) {
    const page = Math.max(1, parseInt(query.page ?? '1', 10));
    const limit = Math.max(1, parseInt(query.limit ?? '50', 10));
    const skip = (page - 1) * limit;

    const where = query.search
      ? {
          userId,
          OR: [
            { name: { contains: query.search, mode: 'insensitive' as const } },
            { email: { contains: query.search, mode: 'insensitive' as const } },
            { phone: { contains: query.search, mode: 'insensitive' as const } },
          ],
        }
      : { userId };

    const [customers, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.customer.count({ where }),
    ]);

    return {
      data: customers,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async deleteCustomer(userId: number, id: number) {
    const customer = await this.prisma.customer.findFirst({
      where: { id, userId },
    });
    if (!customer) throw new NotFoundException('Customer not found');
    await this.prisma.customer.delete({ where: { id } });
  }

  // ── CSV import ─────────────────────────────────────────────────────────────

  async importCsv(userId: number, buffer: Buffer) {
    const rows = this.parseCsvBuffer(buffer);

    if (rows.length === 0) {
      throw new Error(
        "No valid customers found in CSV. Ensure file has 'name' and/or 'email' columns with data.",
      );
    }

    let data = rows;

    if (await this.isStarterUser(userId)) {
      const currentCount = await this.prisma.customer.count({
        where: { userId },
      });
      const remaining = STARTER_CUSTOMER_LIMIT - currentCount;

      if (remaining <= 0) {
        throw new ForbiddenException({
          message: `Starter plan is limited to ${STARTER_CUSTOMER_LIMIT} customers. You've reached the limit. Upgrade to Growth for unlimited customers.`,
          code: 'CUSTOMER_LIMIT_EXCEEDED',
        });
      }

      // Trim to what's allowed rather than rejecting entirely
      if (data.length > remaining) {
        data = data.slice(0, remaining);
      }
    }

    const total = data.length;

    const result = await this.prisma.customer.createMany({
      data: data.map((row) => ({ ...row, userId })),
      skipDuplicates: true,
    });

    const added = result.count;
    const skipped = total - added;

    return { added, skipped };
  }

  // ── CSV parsing ────────────────────────────────────────────────────────────

  private parseCsvBuffer(buffer: Buffer) {
    const raw = buffer.toString('utf8');

    const rows = parse(raw, {
      columns: (headers: string[]) =>
        headers.map((h) => h.trim().toLowerCase()),
      skip_empty_lines: true,
      bom: true,
      trim: true,
      relax_column_count: true,
    }) as unknown as Record<string, string>[];

    const customers: {
      name: string;
      email: string | null;
      phone: string | null;
      lastVisitDate: Date | null;
    }[] = [];

    for (const row of rows) {
      const name = (row['name'] ?? '').trim();
      const email = (row['email'] ?? '').trim().toLowerCase() || null;

      let phone: string | null = (row['phone'] ?? '').trim() || null;
      if (phone && !phone.startsWith('+')) phone = `+${phone}`;
      if (phone) phone = phone.replace(/[\s\-()]/g, '');

      const rawDate = row['lastvisitdate'] ?? row['last_visit_date'] ?? '';
      let lastVisitDate: Date | null = null;
      if (rawDate) {
        const parsed = new Date(rawDate);
        if (!isNaN(parsed.getTime())) lastVisitDate = parsed;
      }

      if (!name && !email) continue;

      customers.push({ name: name || 'Unknown', email, phone, lastVisitDate });
    }

    return customers;
  }
}
