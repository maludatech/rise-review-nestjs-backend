import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { AuthenticatedRequest } from '../types/authenticated-request';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();

    if (req.user?.role !== 'admin') {
      throw new ForbiddenException({
        message: 'Access denied. Admin only.',
        code: 'ADMIN_REQUIRED',
      });
    }

    return true;
  }
}
