import {
  IsDateString,
  IsString,
  IsOptional,
  IsBoolean,
  IsUrl,
  IsInt,
  Min,
} from 'class-validator';

export class UpdateExamSessionDto {
  @IsOptional()
  @IsDateString()
  examDate?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsDateString()
  registrationStartDate?: string;

  @IsOptional()
  @IsDateString()
  registrationDeadline?: string;

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

  @IsOptional()
  @IsInt()
  @Min(1)
  maxParticipants?: number;
}
