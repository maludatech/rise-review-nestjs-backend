import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { AdminGuard } from '../../../common/guards/admin.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { LeadService } from './lead.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { unlink } from 'fs/promises';

@Controller('internal/leads')
@UseGuards(JwtAuthGuard, AdminGuard)
export class LeadController {
  constructor(private readonly leadService: LeadService) {}

  @Post()
  @HttpCode(201)
  async createLead(
    @CurrentUser() user: { id: number },
    @Body() dto: CreateLeadDto,
  ) {
    return this.leadService.createLead(user.id, dto);
  }

  @Post('upload')
  @HttpCode(201)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({ destination: './uploads' }),
    }),
  )
  async uploadCSV(
    @CurrentUser() user: { id: number },
    @UploadedFile() file: { path: string; originalname: string } | undefined,
  ) {
    if (!file) return { message: 'No file uploaded' };

    try {
      return await this.leadService.importCSV(user.id, file.path);
    } finally {
      unlink(file.path).catch(() => {});
    }
  }

  @Get()
  async getLeads(@CurrentUser() user: { id: number }) {
    return this.leadService.getLeads(user.id);
  }

  @Get('stats')
  async getStats() {
    return this.leadService.getStats();
  }

  @Get(':id/history')
  async getHistory(@Param('id', ParseIntPipe) id: number) {
    return this.leadService.getHistory(id);
  }
}
