import { IsNumberString, IsOptional } from 'class-validator';

export class GetReviewsQueryDto {
  @IsOptional()
  @IsNumberString()
  page?: string;

  @IsOptional()
  @IsNumberString()
  limit?: string;
}
