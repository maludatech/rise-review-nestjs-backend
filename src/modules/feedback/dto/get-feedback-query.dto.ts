import { IsIn, IsNumberString, IsOptional } from 'class-validator';

export class GetFeedbackQueryDto {
  @IsOptional()
  @IsNumberString()
  limit?: string;

  @IsOptional()
  @IsIn(['true', 'false'])
  unread?: string;
}
