import { JwtService } from '@nestjs/jwt';

export interface ReviewTokenPayload {
  userId: number;
  customerId: number;
  activityId: number;
  channel: 'whatsapp' | 'email';
  verdict: 'positive' | 'negative';
}

const jwtService = new JwtService({
  secret: process.env.REVIEW_TOKEN_SECRET,
});

export const signReviewToken = (payload: ReviewTokenPayload): string => {
  return jwtService.sign(payload, {
    expiresIn: '7d',
  });
};

export const verifyReviewToken = (token: string): ReviewTokenPayload => {
  return jwtService.verify<ReviewTokenPayload>(token);
};
