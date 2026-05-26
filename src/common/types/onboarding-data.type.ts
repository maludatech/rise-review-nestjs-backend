export type FunnelMessageSet = {
  initial?: string;
  positive?: string;
  negative?: string;
};

export type FunnelChannel = 'email' | 'whatsapp';

export type OnboardingData = {
  reviewTiming?: 'SEVEN_DAYS' | 'THREE_WEEKS' | 'ONE_MONTH' | 'CUSTOM';
  funnel?: {
    email?: FunnelMessageSet;
    whatsapp?: FunnelMessageSet;
  };
  businessInfo?: {
    businessName?: string;
  };
  platform?: Record<string, unknown>;
};
