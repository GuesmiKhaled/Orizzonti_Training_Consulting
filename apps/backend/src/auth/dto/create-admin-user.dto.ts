import {
  IsBoolean,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateAdminUserDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/)
  @MinLength(3)
  @MaxLength(80)
  username: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsInt()
  @Min(1)
  roleId: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  /** Optional contact details; send null on update to clear them. */
  @IsOptional()
  @IsString()
  @MaxLength(200)
  fullName?: string | null;

  @IsOptional()
  @IsEmail()
  @MaxLength(200)
  email?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Matches(/^[+\d\s().-]*$/, { message: 'phone contains invalid characters' })
  phone?: string | null;
}
