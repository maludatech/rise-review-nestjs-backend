import { IsNumber, IsString, MinLength } from 'class-validator';

export class RespondToReviewDto {
  @IsNumber()
  reviewId: number;

  @IsString()
  @MinLength(1, { message: 'Response text is required' })
  response: string;
}
