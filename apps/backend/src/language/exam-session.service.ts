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

    // Validate dates
    const examDate = new Date(dto.examDate);
    const regStartDate = new Date(dto.registrationStartDate);
    const regDeadline = new Date(dto.registrationDeadline);

    if (regDeadline >= examDate) {
      throw new BadRequestException(
        'Registration deadline must be before exam date',
      );
    }

    if (regStartDate >= regDeadline) {
      throw new BadRequestException(
        'Registration start date must be before registration deadline',
      );
    }

    const session = this.examSessionRepository.create({
      languageLevelId: levelId,
      examDate,
      location: dto.location,
      registrationStartDate: regStartDate,
      registrationDeadline: regDeadline,
      price: dto.price,
      courseHours: dto.courseHours,
      subscriptionUrl: dto.subscriptionUrl,
      maxParticipants: dto.maxParticipants ?? null,
      isActive: dto.isActive ?? true,
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
