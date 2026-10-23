import { IsEmail, IsNotEmpty, MaxLength, MinLength } from 'class-validator';

export class ContactDto {
  @IsNotEmpty()
  @MaxLength(120)
  name: string | undefined;

  @IsNotEmpty()
  @IsEmail()
  @MaxLength(255)
  email: string | undefined;

  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(200)
  subject: string | undefined;

  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(2000)
  message: string | undefined;
}
