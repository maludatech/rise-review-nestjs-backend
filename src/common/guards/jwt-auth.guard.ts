import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { Request } from 'express';

interface AuthRequest extends Request {
  user?: {
    id: number;
    role: string;
  };
}

interface DecodedToken {
  id: string | number;
  email: string;
  role?: string;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthRequest>();

    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Not authorized');
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET as string,
      ) as DecodedToken;

      request.user = {
        id: Number(decoded.id),
        role: decoded.role ?? 'user',
      };

      return true;
    } catch {
      throw new UnauthorizedException('Token failed');
    }
  }
}
