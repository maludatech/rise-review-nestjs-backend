import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import argon2 from 'argon2';
import * as jwt from 'jsonwebtoken';
import { InternalPrismaService } from '../../prisma/internal/prisma.service';

@Injectable()
export class AdminAuthService {
  constructor(private readonly prisma: InternalPrismaService) {}

  async register(name: string, email: string, password: string) {
    const existing = await this.prisma.admin.findUnique({ where: { email } });
    if (existing) throw new ConflictException('Admin already exists');

    const hashed = await argon2.hash(password);
    const admin = await this.prisma.admin.create({
      data: { name, email, password: hashed },
    });

    const token = this.signToken(admin.id, email);
    const { password: _, ...adminData } = admin;
    return { admin: adminData, token };
  }

  async login(email: string, password: string) {
    const admin = await this.prisma.admin.findUnique({ where: { email } });
    if (!admin) throw new BadRequestException('Invalid credentials');

    const valid = await argon2.verify(admin.password, password);
    if (!valid) throw new BadRequestException('Invalid credentials');

    const token = this.signToken(admin.id, email);
    const { password: _, ...adminData } = admin;
    return { admin: adminData, token };
  }

  async getProfile(adminId: number) {
    const admin = await this.prisma.admin.findUnique({
      where: { id: adminId },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!admin) throw new BadRequestException('Admin not found');
    return admin;
  }

  private signToken(id: number, email: string): string {
    return jwt.sign(
      { id, email, role: 'admin' },
      process.env.JWT_SECRET as string,
      { expiresIn: '7d' },
    );
  }
}
