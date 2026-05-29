import jwt, { Secret, SignOptions } from 'jsonwebtoken';

const SECRET: Secret = process.env.JWT_SECRET as Secret;

if (!SECRET) {
  throw new Error('JWT_SECRET is not set');
}

const DEFAULT_EXPIRES: SignOptions['expiresIn'] =
  (process.env.JWT_STATE_EXPIRES as SignOptions['expiresIn']) || '10m';

export function signState<T extends object>(
  payload: T,
  expiresIn: SignOptions['expiresIn'] = DEFAULT_EXPIRES,
): string {
  return jwt.sign(payload, SECRET, { expiresIn });
}

export function verifyState<T = unknown>(token: string): T {
  return jwt.verify(token, SECRET) as T;
}
