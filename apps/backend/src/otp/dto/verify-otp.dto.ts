import { IsString, Length, Matches } from 'class-validator';

export class VerifyOtpDto {
  @IsString()
  challengeId!: string;

  @IsString()
  @Length(6, 6)
  @Matches(/^\d{6}$/)
  code!: string;
}
