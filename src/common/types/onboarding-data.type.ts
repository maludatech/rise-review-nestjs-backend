export type FunnelMessageSet = {
  initial?: string;
  positive?: string;
  negative?: string;
};

export type FunnelChannel = 'email' | 'whatsapp';

export type OnboardingData = {
  reviewTiming?: string;
  funnel?: {
    email?: FunnelMessageSet;
    whatsapp?: FunnelMessageSet;
  };
  businessInfo?: {
    businessName?: string;
    category?: string;
    address?: string;
    country?: string;
    website?: string;
    mapsLink?: string;
  };
  platform?: Record<string, unknown>;
};

export type CoverManagerPlatform = {
  connected?: boolean;
  apiKey?: string;
  restaurantId?: string;
};

export type OpenTablePlatform = {
  connected?: boolean;
  clientId?: string;
  clientSecret?: string;
  restaurantId?: string;
};
