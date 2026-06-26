import { IsOptional, IsString } from 'class-validator';

export class CreateLeadDto {
  @IsString()
  businessName: string;

  @IsString()
  email: string;

  @IsString()
  city: string;

  @IsOptional()
  @IsString()
  industry?: string;
}
