import { PartialType } from '@nestjs/mapped-types';
import { CreateLanguageLevelDto } from './create-language-level.dto';

export class UpdateLanguageLevelDto extends PartialType(
  CreateLanguageLevelDto,
) {}
