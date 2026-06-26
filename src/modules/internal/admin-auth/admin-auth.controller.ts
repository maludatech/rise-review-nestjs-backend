import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { AdminGuard } from '../../../common/guards/admin.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { AdminAuthService } from './admin-auth.service';
import { RegisterAdminDto } from './dto/register-admin.dto';
import { LoginAdminDto } from './dto/login-admin.dto';

@Controller('internal/auth')
export class AdminAuthController {
  constructor(private readonly adminAuthService: AdminAuthService) {}

  @Post('register')
  @HttpCode(201)
  async register(@Body() dto: RegisterAdminDto) {
    return this.adminAuthService.register(dto.name, dto.email, dto.password);
  }

  @Post('login')
  @HttpCode(200)
  async login(@Body() dto: LoginAdminDto) {
    return this.adminAuthService.login(dto.email, dto.password);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async getProfile(@CurrentUser() user: { id: number }) {
    return this.adminAuthService.getProfile(user.id);
  }
}
