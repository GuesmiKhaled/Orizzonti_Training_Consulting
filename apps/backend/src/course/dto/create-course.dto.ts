import { IsNotEmpty, IsOptional, MaxLength, MinLength } from 'class-validator';

export class CreateCourseDto {
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(200)
  name: string;

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
  imageUrl?: string;
}
