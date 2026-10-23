import {
  IsDateString,
  IsString,
  IsOptional,
  IsBoolean,
  IsUrl,
  IsInt,
  Min,
} from 'class-validator';

export class CreateExamSessionDto {
  @IsDateString()
  examDate: string | undefined;

  @IsOptional()
  @IsString()
  location?: string;

  @IsDateString()
  registrationStartDate: string | undefined;

  @IsDateString()
  registrationDeadline: string | undefined;

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
