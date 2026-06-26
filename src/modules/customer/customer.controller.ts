import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { File as MulterFile } from 'multer';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PlanGuard } from '../../common/guards/plan.guard';
import { RequirePlan } from '../../common/decorators/require-plan.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CustomerService } from './customer.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { GetCustomersQueryDto } from './dto/get-customers-query.dto';

@Controller('rise-review/customers')
@UseGuards(JwtAuthGuard, PlanGuard)
@RequirePlan('starter')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Post()
  @HttpCode(201)
  async createCustomer(
    @CurrentUser() user: { id: number },
    @Body() dto: CreateCustomerDto,
  ) {
    const data = await this.customerService.createCustomer(user.id, dto);
    return { success: true, data };
  }

  @Get()
  async getCustomers(
    @CurrentUser() user: { id: number },
    @Query() query: GetCustomersQueryDto,
  ) {
    const result = await this.customerService.getCustomers(user.id, query);
    return { success: true, ...result };
  }

  @Post('csv')
  @HttpCode(201)
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  async uploadCsv(
    @CurrentUser() user: { id: number },
    @UploadedFile() file: MulterFile,
  ) {
    if (!file) throw new BadRequestException('CSV file is required');

    const { added, skipped } = await this.customerService.importCsv(
      user.id,
      file.buffer,
    );

    return {
      success: true,
      added,
      skipped,
      ...(skipped > 0 && { message: `${skipped} duplicates skipped` }),
    };
  }

  @Delete(':id')
  async deleteCustomer(
    @CurrentUser() user: { id: number },
    @Param('id', ParseIntPipe) id: number,
  ) {
    await this.customerService.deleteCustomer(user.id, id);
    return { success: true, message: 'Customer deleted' };
  }
}
