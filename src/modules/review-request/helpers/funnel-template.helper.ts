import type {
  OnboardingData,
  FunnelChannel,
} from '../../../common/types/onboarding-data.type';

export function getFunnelTemplates(
  user: { onboardingData?: OnboardingData | null },
  channel: FunnelChannel,
) {
  const funnel = user.onboardingData?.funnel;

  const channelFunnel = funnel?.[channel];
  const fallback = funnel?.whatsapp;

  return {
    initial:
      channelFunnel?.initial ??
      fallback?.initial ??
      'Hi {FirstName}, thanks for visiting {BusinessName}! How was your experience?',

    positive:
      channelFunnel?.positive ??
      fallback?.positive ??
      "We're thrilled to hear that! 🎉 Could you share your experience on Google? {review_link}",

    negative:
      channelFunnel?.negative ??
      fallback?.negative ??
      "We're sorry your experience wasn't perfect. 😔 Could you tell us what went wrong? {feedback_link}",
  };
}
