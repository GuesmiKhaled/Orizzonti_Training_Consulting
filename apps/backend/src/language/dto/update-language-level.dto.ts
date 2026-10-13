import { IsString, IsOptional, IsBoolean, IsIn } from 'class-validator';

export class UpdateLanguageLevelDto {
  @IsOptional()
  @IsString()
  @IsIn(['A1', 'A2', 'B1', 'B2', 'C1', 'C2'])
  cefrLevel?: string;

  @IsOptional()
  @IsString()
  price?: string;

  @IsOptional()
  @IsString()
  courseHours?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
