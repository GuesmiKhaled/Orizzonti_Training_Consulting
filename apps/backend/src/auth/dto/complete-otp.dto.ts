import { IsNotEmpty, IsString, MinLength, MaxLength } from 'class-validator';

export class CompleteOtpDto {
  @IsString()
  @IsNotEmpty()
  challengeId!: string;

  @IsString()
  @MinLength(4)
  @MaxLength(10)
  code!: string;
}
