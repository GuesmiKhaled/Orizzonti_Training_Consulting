import { PartialType } from '@nestjs/mapped-types';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreateMediaDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  /** An http(s) URL or a site-relative path such as /uploads/x.png. */
  @IsString()
  @MaxLength(255)
  @Matches(/^(https?:\/\/|\/)\S+$/, {
    message: 'imageUrl must be an http(s) URL or an absolute path',
  })
  imageUrl: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  altText?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateMediaDto extends PartialType(CreateMediaDto) {}
