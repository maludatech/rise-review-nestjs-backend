import { IsOptional, IsString } from 'class-validator';

export class UpdateBusinessInfoDto {
  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  website?: string;
}
