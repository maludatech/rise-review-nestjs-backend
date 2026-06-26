import { IsObject, IsOptional, IsString } from 'class-validator';

class BusinessDto {
  @IsString()
  name!: string;

  @IsString()
  phone!: string;

  @IsOptional()
  @IsString()
  url?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  category?: string;
}

export class StartVerificationDto {
  @IsObject()
  business!: BusinessDto;

  @IsOptional()
  @IsString()
  method?: string;
}
