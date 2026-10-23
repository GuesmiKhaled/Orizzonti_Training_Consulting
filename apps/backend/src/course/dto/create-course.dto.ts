import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateCourseDto {
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(200)
  name: string | undefined;

  @IsOptional()
  slug?: string;

  @IsOptional()
  level?: string;

  @IsOptional()
  price?: string;

  @IsOptional()
  startDate?: string;

  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  imageUrl?: string;
}
