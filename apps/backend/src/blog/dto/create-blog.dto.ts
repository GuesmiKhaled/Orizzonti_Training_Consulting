import { IsBoolean, IsNotEmpty, IsOptional, MaxLength, MinLength } from 'class-validator';

export class CreateBlogDto {
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(200)
  title: string;

  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(500)
  excerpt: string;

  @IsNotEmpty()
  @MinLength(20)
  content: string;

  @IsOptional()
  slug?: string;

  @IsOptional()
  imageUrl?: string;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}
