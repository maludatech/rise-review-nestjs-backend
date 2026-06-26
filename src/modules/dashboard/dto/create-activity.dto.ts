import { IsEnum, IsOptional, IsString } from 'class-validator';

export class CreateActivityDto {
  @IsEnum([
    'message_sent',
    'customer_reply',
    'ai_response',
    'review',
    'system',
    'campaign',
    'reservation',
  ])
  type: string;

  @IsOptional()
  @IsString()
  sourceId?: string;

  @IsOptional()
  @IsString()
  platform?: string;

  @IsOptional()
  @IsString()
  customer?: string;

  @IsOptional()
  @IsString()
  rating?: string;

  @IsOptional()
  @IsString()
  preview?: string;

  @IsOptional()
  @IsEnum(['pending', 'sent', 'replied', 'approved', 'intercepting'])
  status?: string;
}
