import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { CreateExamSessionDto } from './create-exam-session.dto';
import { CreateLanguageLevelDto } from './create-language-level.dto';
import { CreateLanguageDto } from './create-language.dto';

export class WizardLevelDto extends CreateLanguageLevelDto {
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => CreateExamSessionDto)
  exams?: CreateExamSessionDto[];
}

export class CreateLanguageWizardDto {
  @ValidateNested()
  @Type(() => CreateLanguageDto)
  language: CreateLanguageDto;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(6)
  @ValidateNested({ each: true })
  @Type(() => WizardLevelDto)
  levels?: WizardLevelDto[];
}
