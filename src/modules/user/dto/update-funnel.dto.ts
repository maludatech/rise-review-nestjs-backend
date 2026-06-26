import { IsIn, IsOptional, IsString } from 'class-validator';

export class UpdateFunnelDto {
  @IsIn(['whatsapp', 'email'])
  channel: 'whatsapp' | 'email';

  @IsOptional()
  @IsString()
  initial?: string;

  @IsOptional()
  @IsString()
  positive?: string;

  @IsOptional()
  @IsString()
  negative?: string;
}
