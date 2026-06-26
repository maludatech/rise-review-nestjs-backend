import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import argon2 from 'argon2';
import { RiseReviewPrismaService } from '../prisma/rise-review/prisma.service';
import type { OnboardingData } from '../../common/types/onboarding-data.type';

type GoogleBusiness = {
  name?: string;
  url?: string;
  verified?: boolean;
  [key: string]: unknown;
};

type NotificationPreferences = {
  email?: {
    newReview?: boolean;
    negativeReview?: boolean;
    weeklyReport?: boolean;
    dailyReport?: boolean;
  };
};

@Injectable()
export class UserService {
  constructor(private readonly prisma: RiseReviewPrismaService) {}

  async getProfile(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        email: true,
        language: true,
        image: true,
        googleBusiness: true,
        onboardingData: true,
        subscriptionPlan: true,
        subscriptionStatus: true,
        subscriptionCurrentPeriodEnd: true,
        subscriptionCancelAtPeriodEnd: true,
        isOnTrial: true,
        trialEndDate: true,
      },
    });

    if (!user) throw new NotFoundException('User not found');

    const onboarding = user.onboardingData as OnboardingData | null;
    const googleBusiness = user.googleBusiness as GoogleBusiness | null;
    const businessInfo = onboarding?.businessInfo ?? {};
    const platforms = (onboarding?.platform ?? {}) as Record<
      string,
      { connected?: boolean }
    >;
    const funnel = onboarding?.funnel ?? {};

    const normalizedFunnel = {
      whatsapp: {
        initial: funnel.whatsapp?.initial?.trim() ?? '',
        positive: funnel.whatsapp?.positive?.trim() ?? '',
        negative: funnel.whatsapp?.negative?.trim() ?? '',
      },
      email: {
        initial: funnel.email?.initial?.trim() ?? '',
        positive: funnel.email?.positive?.trim() ?? '',
        negative: funnel.email?.negative?.trim() ?? '',
      },
    };

    return {
      fullName: user.name?.trim() ?? '',
      email: user.email,
      language: user.language ?? 'en',
      image: user.image ?? null,
      subscriptionPlan: user.subscriptionPlan ?? null,
      subscriptionStatus: user.subscriptionStatus ?? 'inactive',
      subscriptionCurrentPeriodEnd: user.subscriptionCurrentPeriodEnd ?? null,
      subscriptionCancelAtPeriodEnd:
        user.subscriptionCancelAtPeriodEnd ?? false,
      isOnTrial: user.isOnTrial ?? false,
      trialEndDate: user.trialEndDate ?? null,
      business: {
        name:
          businessInfo.businessName?.trim() ??
          googleBusiness?.name?.trim() ??
          '',
        category: businessInfo.category?.trim() ?? '',
        country: businessInfo.country?.trim() ?? '',
      },
      googleBusiness: googleBusiness
        ? {
            name: googleBusiness.name?.trim() ?? '',
            url: googleBusiness.url ?? '',
            verified: !!googleBusiness.verified,
          }
        : null,
      platforms: Object.fromEntries(
        Object.entries(platforms).map(([key, val]) => [
          key,
          { connected: !!val?.connected },
        ]),
      ),
      defaultReviewTiming: onboarding?.reviewTiming ?? '7days',
      funnel: normalizedFunnel,
    };
  }

  async updateProfile(
    userId: number,
    dto: { fullName?: string; language?: string; image?: string },
  ) {
    const data: Record<string, string> = {};
    if (dto.fullName !== undefined) data.name = dto.fullName.trim();
    if (dto.language !== undefined) data.language = dto.language;
    if (dto.image !== undefined) data.image = dto.image;

    const user = await this.prisma.user.update({
      where: { id: userId },
      data,
      select: { name: true, email: true, language: true, image: true },
    });

    return {
      fullName: user.name ?? '',
      email: user.email,
      language: user.language ?? 'en',
      image: user.image ?? null,
    };
  }

  async changePassword(
    userId: number,
    oldPassword: string,
    newPassword: string,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { password: true },
    });

    if (!user?.password) throw new BadRequestException('Invalid user');

    const valid = await argon2.verify(user.password, oldPassword);
    if (!valid) throw new BadRequestException('Old password is incorrect');

    if (oldPassword === newPassword) {
      throw new BadRequestException(
        'New password must be different from your current password',
      );
    }

    const hashed = await argon2.hash(newPassword);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashed },
    });
  }

  async updateFunnelMessage(
    userId: number,
    channel: 'whatsapp' | 'email',
    fields: { initial?: string; positive?: string; negative?: string },
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { onboardingData: true },
    });

    if (!user) throw new NotFoundException('User not found');

    const onboarding = (user.onboardingData ?? {}) as OnboardingData;
    const funnel = (onboarding.funnel ?? {}) as Record<
      string,
      Record<string, string>
    >;
    const channelFunnel = { ...(funnel[channel] ?? {}) };

    if (fields.initial !== undefined) channelFunnel.initial = fields.initial;
    if (fields.positive !== undefined) channelFunnel.positive = fields.positive;
    if (fields.negative !== undefined) channelFunnel.negative = fields.negative;

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        onboardingData: JSON.parse(
          JSON.stringify({
            ...onboarding,
            funnel: { ...funnel, [channel]: channelFunnel },
          }),
        ),
      },
    });
  }

  async getBusinessInfo(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { onboardingData: true, googleBusiness: true },
    });

    if (!user) throw new NotFoundException('User not found');

    const onboarding = user.onboardingData as OnboardingData | null;
    const googleBusiness = user.googleBusiness as GoogleBusiness | null;
    const info = onboarding?.businessInfo ?? {};

    const mapsLink = info.mapsLink?.trim() ?? googleBusiness?.url?.trim() ?? '';

    return {
      businessName: (info.businessName ?? '').trim(),
      category: (info.category ?? '').trim(),
      address: (info.address ?? '').trim(),
      country: (info.country ?? '').trim(),
      website: (info.website ?? '').trim(),
      mapsLink,
    };
  }

  async updateBusinessInfo(
    userId: number,
    dto: { address?: string; website?: string },
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { onboardingData: true, googleBusiness: true },
    });

    if (!user) throw new NotFoundException('User not found');

    const onboarding = (user.onboardingData ?? {}) as OnboardingData;
    const businessInfo = { ...(onboarding.businessInfo ?? {}) };

    if (dto.address !== undefined) businessInfo.address = dto.address.trim();
    if (dto.website !== undefined) businessInfo.website = dto.website.trim();

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        onboardingData: JSON.parse(
          JSON.stringify({ ...onboarding, businessInfo }),
        ),
      },
    });

    const googleBusiness = user.googleBusiness as GoogleBusiness | null;

    return {
      businessName: (businessInfo.businessName ?? '').trim(),
      category: (businessInfo.category ?? '').trim(),
      address: (businessInfo.address ?? '').trim(),
      country: (businessInfo.country ?? '').trim(),
      website: (businessInfo.website ?? '').trim(),
      mapsLink:
        businessInfo.mapsLink?.trim() ?? googleBusiness?.url?.trim() ?? '',
    };
  }

  async getNotificationPreferences(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { notificationPreferences: true },
    });

    if (!user) throw new NotFoundException('User not found');

    return (
      (user.notificationPreferences as NotificationPreferences) ?? {
        email: {
          newReview: true,
          negativeReview: false,
          weeklyReport: true,
          dailyReport: false,
        },
      }
    );
  }

  async updateNotificationPreferences(
    userId: number,
    preferences: NotificationPreferences,
  ) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { notificationPreferences: preferences },
      select: { notificationPreferences: true },
    });

    return user.notificationPreferences;
  }

  async saveOnboardingData(userId: number, data: Record<string, unknown>) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { onboardingData: true },
    });

    if (!user) throw new NotFoundException('User not found');

    const merged = { ...(user.onboardingData as object), ...data };

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        onboardingData: JSON.parse(JSON.stringify(merged)),
        onboardingComplete: true,
      },
      select: { onboardingData: true },
    });

    return updated.onboardingData;
  }
}
