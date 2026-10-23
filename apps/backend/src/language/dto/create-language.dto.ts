import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import {
  IMAGE_LIBRARY_PATH,
  IMAGE_LIBRARY_PATH_MESSAGE,
} from '../image-library-path';

export class CreateLanguageDto {
  @IsNotEmpty()
  @MaxLength(100)
  name: string | undefined;

  @IsOptional()
  @MaxLength(20)
  code?: string;

  @IsOptional()
  @MaxLength(100)
  nativeName?: string;

  /** Send null on update to remove the picture. */
  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Matches(IMAGE_LIBRARY_PATH, { message: IMAGE_LIBRARY_PATH_MESSAGE })
  imageUrl?: string | null;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
