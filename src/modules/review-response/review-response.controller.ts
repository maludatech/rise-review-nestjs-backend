import { Controller, Get, Logger, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ReviewResponseService } from './review-response.service';

// Public endpoint — no JwtAuthGuard, no PlanGuard
@Controller('rise-review/review-response')
export class ReviewResponseController {
  private readonly logger = new Logger(ReviewResponseController.name);

  constructor(private readonly reviewResponseService: ReviewResponseService) {}

  @Get()
  async handleReviewResponse(
    @Query('t') token: string,
    @Res() res: Response,
  ) {
    if (!token) {
      return res.status(400).send('Invalid link.');
    }

    let redirectUrl: string;
    let followUp: (() => Promise<void>) | null;

    try {
      ({ redirectUrl, followUp } = await this.reviewResponseService.handleResponse(token));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';

      if (msg === 'USER_OR_CUSTOMER_NOT_FOUND') {
        return res.status(404).send('Something went wrong. Please try again.');
      }

      // Expired or invalid JWT
      return res.status(400).send('This link has expired or is invalid.');
    }

    // Redirect immediately — customer doesn't wait for follow-up
    res.redirect(redirectUrl);

    // Fire-and-forget follow-up after redirect is sent
    if (followUp) {
      followUp().catch((err) =>
        this.logger.error('[review-response] Follow-up failed', err),
      );
    }
  }
}
