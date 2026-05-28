import { Prisma, Review } from '../../generated/rise-review/client';

export interface GoogleBusiness {
  name?: string;
  url?: string;
  country?: string;
  category?: string;
  verified?: boolean;
  phone?: string;
}

export interface ScrapedReview {
  name?: string;
  text?: string;
  stars?: number | string;
  rating?: number | string;
  publishedAtDate?: Date | null;
}

export interface NotificationPreferences {
  email?: {
    newReview?: boolean;
    negativeReview?: boolean;
    weeklyReport?: boolean;
    dailyReport?: boolean;
  };
}

export interface BusinessInfo {
  businessName?: string;
  category?: string;
  address?: string;
  country?: string;
  website?: string;
  mapsLink?: string;
}

export interface OnboardingDataReview {
  businessInfo?: BusinessInfo;
}

export type SafeUser = {
  id: number;
  email: string;
  name: string | null;
  businessUrl: string | null;

  googleBusiness: Prisma.JsonValue;
  onboardingData: Prisma.JsonValue;
  notificationPreferences: Prisma.JsonValue;
};

export type ReviewEntity = Review;
