import { IsEmail, IsNotEmpty, MaxLength, MinLength } from 'class-validator';

export class ContactDto {
  @IsNotEmpty()
  @MaxLength(120)
  name: string;

  @IsNotEmpty()
  @IsEmail()
  @MaxLength(255)
  email: string;

  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(200)
  subject: string;

  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(2000)
  message: string;
}
