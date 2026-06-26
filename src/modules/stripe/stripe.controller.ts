import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { StripeService } from './stripe.service';

@Controller('rise-review/stripe')
export class StripeController {
  constructor(private readonly stripeService: StripeService) {}

  // Raw body available via req.rawBody (NestFactory created with rawBody: true)
  // Public — Stripe signs the payload
  @Post('webhook')
  @HttpCode(200)
  async handleWebhook(
    @Req() req: Request & { rawBody?: Buffer },
    @Headers('stripe-signature') sig: string,
  ) {
    const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;
    if (!rawBody) throw new BadRequestException('Missing raw body');
    await this.stripeService.handleWebhook(rawBody, sig);
    return { received: true };
  }

  @Post('checkout')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  async createCheckout(
    @CurrentUser() user: { id: number },
    @Body('priceId') priceId: string,
  ) {
    if (!priceId) throw new BadRequestException('Price ID is required');
    const url = await this.stripeService.createCheckoutSession(
      user.id,
      priceId,
    );
    return { success: true, url };
  }

  @Post('portal')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  async createPortal(@CurrentUser() user: { id: number }) {
    const url = await this.stripeService.createPortalSession(user.id);
    return { success: true, url };
  }

  @Get('subscription')
  @UseGuards(JwtAuthGuard)
  async getSubscription(@CurrentUser() user: { id: number }) {
    const data = await this.stripeService.getSubscription(user.id);
    return { success: true, data };
  }
}
