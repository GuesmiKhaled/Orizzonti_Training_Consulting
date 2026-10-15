import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateMailSettingsDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  host?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(65535)
  port?: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  username?: string;

  /** Write-only; an empty value keeps the stored password. */
  @IsOptional()
  @IsString()
  @MaxLength(500)
  password?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  fromAddress?: string;

  @IsOptional()
  @IsBoolean()
  secure?: boolean;
}
