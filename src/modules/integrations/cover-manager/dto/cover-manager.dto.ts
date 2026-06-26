import { IsOptional, IsString } from 'class-validator';

export class CoverManagerDto {
  @IsString()
  apiKey: string;

  @IsString()
  restaurantId: string;

  @IsOptional()
  @IsString()
  user_email?: string;

  @IsOptional()
  @IsString()
  user_phone?: string;
}
