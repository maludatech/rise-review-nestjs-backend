import { signReviewToken } from '../../../common/helpers/review-token.helper';

export function buildReviewLinks(
  userId: number,
  customerId: number,
  activityId: number,
  channel: 'whatsapp' | 'email',
) {
  const positiveToken = signReviewToken({
    userId,
    customerId,
    activityId,
    channel,
    verdict: 'positive',
  });

  const negativeToken = signReviewToken({
    userId,
    customerId,
    activityId,
    channel,
    verdict: 'negative',
  });

  const BASE_URL = process.env.PUBLIC_URL!;
  const APP_URL = process.env.FRONTEND_URL!;

  return {
    positiveUrl: `${BASE_URL}/api/rise-review/review-response?t=${positiveToken}`,
    negativeUrl: `${APP_URL}/feedback?t=${negativeToken}`,
  };
}
