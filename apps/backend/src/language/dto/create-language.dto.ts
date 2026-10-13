import { IsBoolean, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class CreateLanguageDto {
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsOptional()
  @MaxLength(20)
  code?: string;

  @IsOptional()
  @MaxLength(100)
  nativeName?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
