import type { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    role?: 'admin' | 'user';
  };

  userDoc?: {
    subscriptionStatus: string;
    subscriptionPlan: string | null; // ✅ FIX
    trialEndDate: Date | string | null;
    role: string;
  };
}
