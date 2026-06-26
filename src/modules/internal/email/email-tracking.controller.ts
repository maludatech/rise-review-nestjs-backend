import {
  Controller,
  Get,
  Logger,
  Param,
  ParseIntPipe,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { InternalPrismaService } from '../../prisma/internal/prisma.service';

const TRANSPARENT_PIXEL = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==',
  'base64',
);

// All tracking endpoints are public — no auth (pixel, redirect, unsubscribe)
@Controller()
export class EmailTrackingController {
  private readonly logger = new Logger(EmailTrackingController.name);

  constructor(private readonly prisma: InternalPrismaService) {}

  @Get('internal/email/open/:leadId')
  async trackOpen(
    @Param('leadId', ParseIntPipe) leadId: number,
    @Res() res: Response,
  ) {
    try {
      const updated = await this.prisma.lead.updateMany({
        where: { id: leadId, opened: false },
        data: { opened: true, openedAt: new Date() },
      });

      if (updated.count > 0) {
        await this.prisma.leadHistory.create({
          data: { leadId, action: 'EMAIL_OPENED', metadata: {} },
        });
      }
    } catch (err) {
      this.logger.error('Failed to track email open', err);
    }

    res.set('Content-Type', 'image/gif');
    res.set(
      'Cache-Control',
      'no-store, no-cache, must-revalidate, proxy-revalidate',
    );
    res.set('Content-Length', TRANSPARENT_PIXEL.length.toString());
    return res.status(200).send(TRANSPARENT_PIXEL);
  }

  @Get('internal/email/track-click/:leadId')
  async trackClick(
    @Param('leadId', ParseIntPipe) leadId: number,
    @Res() res: Response,
  ) {
    try {
      const updated = await this.prisma.lead.updateMany({
        where: { id: leadId, opened: false },
        data: { opened: true, openedAt: new Date() },
      });

      if (updated.count > 0) {
        await this.prisma.leadHistory.create({
          data: { leadId, action: 'CLICKED_LINK', metadata: {} },
        });
      }
    } catch (err) {
      this.logger.error('Failed to track click', err);
    }

    return res.redirect('https://review-flow.io/get-started');
  }

  @Get('unsubscribe/:token')
  async unsubscribe(@Param('token') token: string, @Res() res: Response) {
    if (!token) return res.status(400).send('Invalid unsubscribe link.');

    try {
      const lead = await this.prisma.lead.findFirst({
        where: { unsubscribeToken: token },
      });

      if (!lead) return res.status(404).send('Lead not found.');

      await this.prisma.lead.update({
        where: { id: lead.id },
        data: { unsubscribed: true },
      });

      return res.redirect('https://review-flow-ai.vercel.app/unsubscribed');
    } catch (err) {
      this.logger.error('Unsubscribe failed', err);
      return res.status(500).send('Unsubscribe failed.');
    }
  }
}
