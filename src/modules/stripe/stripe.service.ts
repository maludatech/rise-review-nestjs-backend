import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-assignment
const Stripe = require('stripe');
import { RiseReviewPrismaService } from '../prisma/rise-review/prisma.service';

// eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
function createStripeClient() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY is not configured');
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
  return new Stripe(key, { apiVersion: '2026-04-22.dahlia' }) as {
    customers: { create: Function; list?: Function };
    checkout: { sessions: { create: Function } };
    billingPortal: { sessions: { create: Function } };
    invoices: { list: Function };
    webhooks: {
      constructEvent: (body: Buffer, sig: string, secret: string) => unknown;
    };
    [key: string]: unknown;
  };
}

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);
  private readonly stripe: ReturnType<typeof createStripeClient>;

  constructor(private readonly prisma: RiseReviewPrismaService) {
    this.stripe = createStripeClient();
  }

  async createCheckoutSession(userId: number, priceId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true, stripeCustomerId: true },
    });
    if (!user) throw new NotFoundException('User not found');

    const frontendUrl =
      process.env.FRONTEND_URL ?? 'https://rise-review.vercel.app';

    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await this.stripe.customers.create({
        email: user.email,
        name: user.name ?? undefined,
        metadata: { userId: String(userId) },
      });
      customerId = customer.id;
      await this.prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId: customer.id },
      });
    }

    const session = await this.stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${frontendUrl}/settings?tab=billing&success=true`,
      cancel_url: `${frontendUrl}/settings?tab=billing&canceled=true`,
      metadata: { userId: String(userId) },
      subscription_data: { metadata: { userId: String(userId) } },
    });

    return session.url;
  }

  async createPortalSession(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { stripeCustomerId: true },
    });

    if (!user?.stripeCustomerId) {
      throw new BadRequestException('No active subscription found');
    }

    const frontendUrl =
      process.env.FRONTEND_URL ?? 'https://rise-review.vercel.app';

    const session = await this.stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${frontendUrl}/settings?tab=billing`,
    });

    return session.url;
  }

  async getSubscription(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        stripeCustomerId: true,
        stripeSubscriptionId: true,
        subscriptionStatus: true,
        subscriptionPlan: true,
        subscriptionCurrentPeriodEnd: true,
        subscriptionCancelAtPeriodEnd: true,
        isOnTrial: true,
        trialEndDate: true,
      },
    });
    if (!user) throw new NotFoundException('User not found');

    let invoices: object[] = [];
    if (user.stripeCustomerId) {
      try {
        const stripeInvoices = await this.stripe.invoices.list({
          customer: user.stripeCustomerId,
          limit: 10,
        });
        invoices = stripeInvoices.data.map((inv) => ({
          id: inv.id,
          number: inv.number,
          date: new Date(inv.created * 1000).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          }),
          amount: `€${((inv.amount_paid ?? 0) / 100).toFixed(2)}`,
          status: inv.status,
          pdf: inv.invoice_pdf ?? null,
        }));
      } catch (err) {
        this.logger.warn('[stripe] Failed to fetch invoices', err);
      }
    }

    return {
      subscriptionPlan: user.subscriptionPlan,
      subscriptionStatus: user.subscriptionStatus,
      subscriptionCurrentPeriodEnd: user.subscriptionCurrentPeriodEnd,
      subscriptionCancelAtPeriodEnd: user.subscriptionCancelAtPeriodEnd,
      isOnTrial: user.isOnTrial,
      trialEndDate: user.trialEndDate,
      hasStripeCustomer: !!user.stripeCustomerId,
      invoices,
    };
  }

  async handleWebhook(rawBody: Buffer, signature: string) {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
    // Use unknown to avoid Stripe v22 namespace restructuring issues
    let event: { type: string; data: { object: Record<string, unknown> } };

    try {
      event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        webhookSecret,
      ) as typeof event;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown';
      this.logger.error('[stripe] Webhook signature verification failed', msg);
      throw new BadRequestException(`Webhook Error: ${msg}`);
    }

    const obj = event.data.object as Record<string, unknown>;

    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const userId = (obj.metadata as Record<string, string> | undefined)
          ?.userId;
        if (!userId) break;

        const items = obj.items as
          | { data: Array<{ price: { id: string } }> }
          | undefined;
        const priceId = items?.data[0]?.price?.id;
        const periodEnd = obj.current_period_end as number;
        const status = obj.status as string;

        await this.prisma.user.updateMany({
          where: { id: Number(userId) },
          data: {
            stripeSubscriptionId: obj.id as string,
            subscriptionStatus: this.mapStripeStatus(status),
            subscriptionPlan: this.mapPriceToPlan(priceId),
            subscriptionCurrentPeriodEnd: new Date(periodEnd * 1000),
            subscriptionCancelAtPeriodEnd: obj.cancel_at_period_end as boolean,
            isOnTrial: status === 'trialing',
          },
        });

        this.logger.log(`[stripe] Subscription ${status} for user ${userId}`);
        break;
      }

      case 'customer.subscription.deleted': {
        const userId = (obj.metadata as Record<string, string> | undefined)
          ?.userId;
        if (!userId) break;

        await this.prisma.user.updateMany({
          where: { id: Number(userId) },
          data: {
            subscriptionStatus: 'canceled',
            subscriptionPlan: null,
            subscriptionCancelAtPeriodEnd: false,
            isOnTrial: false,
          },
        });

        this.logger.log(`[stripe] Subscription canceled for user ${userId}`);
        break;
      }

      case 'invoice.payment_failed': {
        const customerId = obj.customer as string;

        await this.prisma.user.updateMany({
          where: { stripeCustomerId: customerId },
          data: { subscriptionStatus: 'past_due' },
        });

        this.logger.warn(`[stripe] Payment failed for customer ${customerId}`);
        break;
      }

      case 'checkout.session.completed': {
        const userId = (obj.metadata as Record<string, string> | undefined)
          ?.userId;
        this.logger.log(`[stripe] Checkout completed for user ${userId}`);
        break;
      }

      default:
        this.logger.log(`[stripe] Unhandled event: ${event.type}`);
    }
  }

  private mapStripeStatus(
    status: string,
  ): 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid' | 'inactive' {
    const map: Record<
      string,
      'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid' | 'inactive'
    > = {
      active: 'active',
      trialing: 'trialing',
      past_due: 'past_due',
      canceled: 'canceled',
      unpaid: 'unpaid',
      incomplete: 'inactive',
      incomplete_expired: 'inactive',
      paused: 'inactive',
    };
    return map[status] ?? 'inactive';
  }

  private mapPriceToPlan(
    priceId?: string,
  ): 'starter' | 'growth' | 'enterprise' | null {
    if (!priceId) return null;
    const map: Record<string, 'growth' | 'enterprise'> = {
      [process.env.STRIPE_PRICE_GROWTH_MONTHLY ?? 'price_growth_monthly']:
        'growth',
      [process.env.STRIPE_PRICE_GROWTH_ANNUAL ?? 'price_growth_annual']:
        'growth',
      [process.env.STRIPE_PRICE_ENTERPRISE ?? 'price_enterprise']: 'enterprise',
    };
    return map[priceId] ?? null;
  }
}
