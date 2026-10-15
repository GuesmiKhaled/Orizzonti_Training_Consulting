import { BadRequestException } from '@nestjs/common';
import { ExamSession } from './exam-session.entity';
import { CreateExamSessionDto } from './dto/create-exam-session.dto';

/** Shared by single-exam creation and the language wizard. */
export function assertExamDates(
  examDate: Date,
  registrationStartDate: Date,
  registrationDeadline: Date,
): void {
  if (registrationDeadline >= examDate) {
    throw new BadRequestException(
      'Registration deadline must be before exam date',
    );
  }
  if (registrationStartDate >= registrationDeadline) {
    throw new BadRequestException(
      'Registration start date must be before registration deadline',
    );
  }
}

export function buildExamFields(
  dto: CreateExamSessionDto,
): Pick<
  ExamSession,
  | 'examDate'
  | 'location'
  | 'registrationStartDate'
  | 'registrationDeadline'
  | 'price'
  | 'courseHours'
  | 'subscriptionUrl'
  | 'maxParticipants'
  | 'isActive'
> {
  return {
    examDate: new Date(dto.examDate),
    location: dto.location as string,
    registrationStartDate: new Date(dto.registrationStartDate),
    registrationDeadline: new Date(dto.registrationDeadline),
    price: dto.price as string,
    courseHours: dto.courseHours as string,
    subscriptionUrl: dto.subscriptionUrl as string,
    maxParticipants: dto.maxParticipants ?? null,
    isActive: dto.isActive ?? true,
  };
}
