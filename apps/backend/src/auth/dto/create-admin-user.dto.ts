import {
  IsBoolean,
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
}
