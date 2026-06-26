import { IsString, MinLength } from 'class-validator';

export class SubmitFeedbackDto {
  @IsString()
  t: string;

  @IsString()
  @MinLength(5, { message: 'Please write at least a few words about your experience.' })
  message: string;
}
