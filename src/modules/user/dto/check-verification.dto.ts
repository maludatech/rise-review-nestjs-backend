import { IsString } from 'class-validator';

export class CheckVerificationDto {
  @IsString()
  code: string;
}
