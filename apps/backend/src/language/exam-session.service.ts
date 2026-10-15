import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExamSession } from './exam-session.entity';
import { LanguageLevel } from './language-level.entity';
import { CreateExamSessionDto } from './dto/create-exam-session.dto';
import { UpdateExamSessionDto } from './dto/update-exam-session.dto';
import { assertExamDates, buildExamFields } from './exam-dates';

@Injectable()
export class ExamSessionService {
  constructor(
    @InjectRepository(ExamSession)
    private readonly examSessionRepository: Repository<ExamSession>,
    @InjectRepository(LanguageLevel)
    private readonly languageLevelRepository: Repository<LanguageLevel>,
  ) {}

  async findByLevelId(languageId: number, levelId: number) {
    // Verify level belongs to language
    const level = await this.languageLevelRepository.findOne({
      where: { id: levelId, languageId },
    });

    if (!level) {
      throw new NotFoundException('Language level not found');
    }

    return this.examSessionRepository.find({
      where: { languageLevelId: levelId },
      relations: { level: true },
      loadEagerRelations: false,
      order: { examDate: 'ASC' },
    });
  }

  async findOne(languageId: number, levelId: number, sessionId: number) {
    // Verify level belongs to language
    const level = await this.languageLevelRepository.findOne({
      where: { id: levelId, languageId },
    });

    if (!level) {
      throw new NotFoundException('Language level not found');
    }

    const session = await this.examSessionRepository.findOne({
      where: { id: sessionId, languageLevelId: levelId },
      relations: { level: true },
      loadEagerRelations: false,
    });

    if (!session) {
      throw new NotFoundException('Exam session not found');
    }

    return session;
  }

  async create(languageId: number, levelId: number, dto: CreateExamSessionDto) {
    // Verify level belongs to language
    const level = await this.languageLevelRepository.findOne({
      where: { id: levelId, languageId },
    });

    if (!level) {
      throw new NotFoundException('Language level not found');
    }

    const fields = buildExamFields(dto);
    assertExamDates(
      fields.examDate,
      fields.registrationStartDate,
      fields.registrationDeadline,
    );

    const session = this.examSessionRepository.create({
      ...fields,
      languageLevelId: levelId,
    });

    return this.examSessionRepository.save(session);
  }

  async update(
    languageId: number,
    levelId: number,
    sessionId: number,
    dto: UpdateExamSessionDto,
  ) {
    const session = await this.findOne(languageId, levelId, sessionId);

    // Validate dates if they are being updated
    if (dto.examDate || dto.registrationDeadline) {
      const examDate = dto.examDate ? new Date(dto.examDate) : session.examDate;
      const regDeadline = dto.registrationDeadline
        ? new Date(dto.registrationDeadline)
        : session.registrationDeadline;

      if (regDeadline >= examDate) {
        throw new BadRequestException(
          'Registration deadline must be before exam date',
        );
      }
    }

    if (dto.registrationStartDate || dto.registrationDeadline) {
      const regStartDate = dto.registrationStartDate
        ? new Date(dto.registrationStartDate)
        : session.registrationStartDate;
      const regDeadline = dto.registrationDeadline
        ? new Date(dto.registrationDeadline)
        : session.registrationDeadline;

      if (regStartDate >= regDeadline) {
        throw new BadRequestException(
          'Registration start date must be before registration deadline',
        );
      }
    }

    // Convert date strings to Date objects if provided
    const updateData = { ...dto };
    if (dto.examDate) {
      updateData.examDate = new Date(dto.examDate) as any;
    }
    if (dto.registrationStartDate) {
      updateData.registrationStartDate = new Date(
        dto.registrationStartDate,
      ) as any;
    }
    if (dto.registrationDeadline) {
      updateData.registrationDeadline = new Date(
        dto.registrationDeadline,
      ) as any;
    }

    Object.assign(session, updateData);
    return this.examSessionRepository.save(session);
  }

  async delete(languageId: number, levelId: number, sessionId: number) {
    const session = await this.findOne(languageId, levelId, sessionId);
    await this.examSessionRepository.remove(session);
    return { deleted: true, id: sessionId };
  }

  async checkBookingEligibility(sessionId: number) {
    const session = await this.examSessionRepository.findOne({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException('Exam session not found');
    }

    const now = new Date();

    if (now > session.registrationDeadline) {
      return {
        isBookable: false,
        status: 'Délai de réservation expiré',
      };
    }

    if (now < session.registrationStartDate) {
      return {
        isBookable: false,
        status: `Registration opens at ${session.registrationStartDate.toLocaleDateString()}`,
      };
    }

    return {
      isBookable: true,
      status: 'Available',
      bookingUrl: session.subscriptionUrl,
    };
  }
}
