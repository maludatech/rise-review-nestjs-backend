import {
  IsBoolean,
  IsObject,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class EmailPreferencesDto {
  @IsOptional()
  @IsBoolean()
  newReview?: boolean;

  @IsOptional()
  @IsBoolean()
  negativeReview?: boolean;

  @IsOptional()
  @IsBoolean()
  weeklyReport?: boolean;

  @IsOptional()
  @IsBoolean()
  dailyReport?: boolean;
}

export class UpdateNotificationPreferencesDto {
  @IsObject()
  @ValidateNested()
  @Type(() => EmailPreferencesDto)
  email: EmailPreferencesDto;
}
