import {
  IsDateString,
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

const URL_OPTIONS = { protocols: ['http', 'https'], require_protocol: true };

/** Every field is optional; send null to clear a value. */
export class UpdateSiteSettingsDto {
  @IsOptional()
  @IsString()
  @MaxLength(150)
  heroTitle?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  heroSubtitle?: string | null;

  @IsOptional()
  @IsEmail()
  @MaxLength(200)
  contactEmail?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Matches(/^[+\d\s().-]*$/, { message: 'contactPhone contains invalid characters' })
  contactPhone?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  contactAddress?: string | null;

  @IsOptional()
  @IsUrl(URL_OPTIONS)
  @MaxLength(300)
  facebookUrl?: string | null;

  @IsOptional()
  @IsUrl(URL_OPTIONS)
  @MaxLength(300)
  instagramUrl?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  aboutText?: string | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1_000_000)
  studentsCount?: number | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100_000)
  coursesCount?: number | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(200)
  yearsOfExperience?: number | null;

  @IsOptional()
  @IsDateString()
  nextSessionDate?: string | null;
}
