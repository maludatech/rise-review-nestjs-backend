import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import argon2 from 'argon2';
import { Twilio } from 'twilio';
import { RiseReviewPrismaService } from '../prisma/rise-review/prisma.service';

const SMS_COOLDOWN_SECONDS = 60;
const SMS_DAILY_LIMIT = 5;
const SMS_DAILY_WINDOW_MS = 24 * 60 * 60 * 1000;

type GoogleVerification = {
  method?: string;
  tokenHash?: string;
  tokenExpiresAt?: string | Date;
  attempts?: number;
  lastSentTo?: string;
  status?: string;
};

type GoogleBusiness = {
  name?: string;
  url?: string;
  phone?: string;
  country?: string;
  category?: string;
  verified?: boolean;
};

@Injectable()
export class OnboardingService {
  private readonly twilio: Twilio;

  constructor(private readonly prisma: RiseReviewPrismaService) {
    this.twilio = new Twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN,
    );
  }

  private async checkAndUpdateSmsRateLimit(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        smsLastSentAt: true,
        smsDailyCount: true,
        smsDailyWindowStart: true,
      },
    });

    if (!user) throw new NotFoundException('User not found');

    const now = new Date();

    if (user.smsLastSentAt) {
      const secondsSinceLast =
        (now.getTime() - new Date(user.smsLastSentAt).getTime()) / 1000;

      if (secondsSinceLast < SMS_COOLDOWN_SECONDS) {
        const retryAfterSeconds = Math.ceil(
          SMS_COOLDOWN_SECONDS - secondsSinceLast,
        );
        throw Object.assign(
          new BadRequestException(
            `Please wait ${retryAfterSeconds} seconds before requesting another code.`,
          ),
          { retryAfterSeconds, statusCode: 429 },
        );
      }
    }

    const windowStart = user.smsDailyWindowStart
      ? new Date(user.smsDailyWindowStart)
      : null;

    const windowExpired =
      !windowStart ||
      now.getTime() - windowStart.getTime() >= SMS_DAILY_WINDOW_MS;

    if (windowExpired) {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          smsDailyCount: 1,
          smsDailyWindowStart: now,
          smsLastSentAt: now,
        },
      });
    } else {
      if ((user.smsDailyCount ?? 0) >= SMS_DAILY_LIMIT) {
        const windowResetAt = new Date(
          windowStart.getTime() + SMS_DAILY_WINDOW_MS,
        );
        const hoursUntilReset = Math.ceil(
          (windowResetAt.getTime() - now.getTime()) / (1000 * 60 * 60),
        );
        throw new BadRequestException(
          `Daily SMS limit reached. Try again in ${hoursUntilReset} hour(s).`,
        );
      }

      await this.prisma.user.update({
        where: { id: userId },
        data: { smsDailyCount: { increment: 1 }, smsLastSentAt: now },
      });
    }
  }

  async startVerification(
    userId: number,
    business: {
      name?: string;
      phone: string;
      url?: string;
      country?: string;
      category?: string;
    },
    method?: string,
  ) {
    await this.checkAndUpdateSmsRateLimit(userId);

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const tokenHash = await argon2.hash(code);

    const phone = business.phone;
    const masked =
      phone.length >= 4
        ? `${'*'.repeat(phone.length - 4)}${phone.slice(-4)}`
        : phone;

    const googleVerification: GoogleVerification = {
      method: method ?? 'sms',
      tokenHash,
      tokenExpiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      attempts: 0,
      lastSentTo: masked,
      status: 'pending',
    };

    const googleBusiness: GoogleBusiness = {
      name: business.name,
      url: business.url,
      phone: business.phone,
      country: business.country,
      category: business.category,
      verified: false,
    };

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        googleVerification: googleVerification,
        googleBusiness: googleBusiness,
      },
    });

    await this.twilio.messages.create({
      body: `Your RiseReview Google Business verification code is ${code}. Valid for 15 minutes.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone,
    });

    return { sentTo: masked };
  }

  async checkVerification(userId: number, rawCode: string) {
    const cleanCode = rawCode.trim().replace(/\D/g, '');
    if (!cleanCode || cleanCode.length !== 6) {
      throw new BadRequestException('Verification code must be 6 digits');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { googleVerification: true, googleBusiness: true },
    });

    if (!user) throw new NotFoundException('User not found');

    const v = user.googleVerification as GoogleVerification | null;

    if (!v?.tokenHash) {
      throw new BadRequestException('No active verification session.');
    }

    if (new Date() > new Date(v.tokenExpiresAt!)) {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          googleVerification: { ...v, status: 'expired' },
        },
      });
      throw new BadRequestException('Verification code expired.');
    }

    const isValid = await argon2.verify(v.tokenHash, cleanCode);
    if (!isValid) {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          googleVerification: {
            ...v,
            attempts: (v.attempts ?? 0) + 1,
          },
        },
      });
      throw new BadRequestException('Invalid verification code.');
    }

    const googleBusiness = (user.googleBusiness ?? {}) as GoogleBusiness;

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        googleVerification: { ...v, status: 'verified' },
        googleBusiness: { ...googleBusiness, verified: true },
      },
    });
  }

  async resendVerification(userId: number) {
    await this.checkAndUpdateSmsRateLimit(userId);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { googleBusiness: true, googleVerification: true },
    });

    if (!user) throw new NotFoundException('User not found');

    const googleBusiness = user.googleBusiness as GoogleBusiness | null;
    const phone = googleBusiness?.phone;

    if (!phone) {
      throw new BadRequestException(
        'No phone number found for verification. Please start over.',
      );
    }

    const token = Math.floor(100000 + Math.random() * 900000).toString();
    const tokenHash = await argon2.hash(token);

    const v = (user.googleVerification ?? {}) as GoogleVerification;

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        googleVerification: {
          ...v,
          tokenHash,
          tokenExpiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
          attempts: (v.attempts ?? 0) + 1,
        },
      },
    });

    await this.twilio.messages.create({
      body: `Your new RiseReview verification code is ${token}. Valid for 10 minutes.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone,
    });
  }
}
