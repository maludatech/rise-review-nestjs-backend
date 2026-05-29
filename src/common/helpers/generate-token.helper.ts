import jwt, { Secret, SignOptions } from 'jsonwebtoken';

const SECRET: Secret = process.env.JWT_SECRET as Secret;

if (!SECRET) {
  throw new Error('JWT_SECRET is not set');
}

const EXPIRES_IN: SignOptions['expiresIn'] = '7d';

export function generateToken(userId: string): string {
  return jwt.sign({ id: userId }, SECRET, {
    expiresIn: EXPIRES_IN,
  });
}
