import {
  IsDateString,
  IsString,
  IsOptional,
  IsBoolean,
  IsUrl,
} from 'class-validator';

export class CreateExamSessionDto {
  @IsDateString()
  examDate: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsDateString()
  registrationStartDate: string;

  @IsDateString()
  registrationDeadline: string;

  @IsOptional()
  @IsString()
  price?: string;

  @IsOptional()
  @IsString()
  courseHours?: string;

  @IsOptional()
  @IsUrl()
  subscriptionUrl?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
