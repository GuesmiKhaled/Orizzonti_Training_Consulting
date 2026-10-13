import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, Repository } from 'typeorm';
import { MailerService } from '../mail/mailer.service';
import { CreateExamRegistrationDto } from './dto/create-exam-registration.dto';
import { computeAvailability, ExamAvailability } from './exam-availability';
import {
  ExamRegistration,
  ExamRegistrationStatus,
} from './exam-registration.entity';
import { ExamSession } from './exam-session.entity';
import { LanguageLevel } from './language-level.entity';

const HELD_STATUSES: ExamRegistrationStatus[] = ['pending', 'accepted'];

@Injectable()
export class ExamRegistrationService {
  private readonly logger = new Logger(ExamRegistrationService.name);

  constructor(
    @InjectRepository(ExamRegistration)
    private readonly registrationRepository: Repository<ExamRegistration>,
    private readonly dataSource: DataSource,
    private readonly mailer: MailerService,
  ) {}

  async decorate<T extends ExamSession>(
    sessions: T[],
  ): Promise<(T & ExamAvailability)[]> {
    const ids = sessions.map((session) => session.id);
    const rows = ids.length
      ? await this.registrationRepository
          .createQueryBuilder('r')
          .select('r.examSessionId', 'examSessionId')
          .addSelect('COUNT(*)', 'count')
          .where('r.examSessionId IN (:...ids)', { ids })
          .andWhere('r.status IN (:...statuses)', { statuses: HELD_STATUSES })
          .groupBy('r.examSessionId')
          .getRawMany<{ examSessionId: number; count: string }>()
      : [];
    const held = new Map(rows.map((r) => [Number(r.examSessionId), Number(r.count)]));
    return sessions.map((session) =>
      Object.assign(
        session,
        computeAvailability(session, held.get(session.id) ?? 0),
      ),
    );
  }

  async register(
    languageId: number,
    levelId: number,
    sessionId: number,
    dto: CreateExamRegistrationDto,
  ) {
    const email = dto.email.trim().toLowerCase();
    const { registration, session } = await this.dataSource.transaction(
      async (manager) => {
        const levelExists = await manager.exists(LanguageLevel, {
          where: { id: levelId, languageId },
        });
        const locked = levelExists
          ? await manager.findOne(ExamSession, {
              where: { id: sessionId, languageLevelId: levelId },
              lock: { mode: 'pessimistic_write' },
            })
          : null;
        if (!locked) {
          throw new NotFoundException('Exam session not found');
        }
        const held = await this.countHeld(manager, sessionId);
        const availability = computeAvailability(locked, held);
        if (!availability.isBookable) {
          throw new BadRequestException(availability.bookingStatus);
        }
        const duplicate = await manager.exists(ExamRegistration, {
          where: {
            examSessionId: sessionId,
            email,
            status: In(HELD_STATUSES),
          },
        });
        if (duplicate) {
          throw new ConflictException(
            'A registration with this email already exists for this exam',
          );
        }
        const created = await manager.save(
          manager.create(ExamRegistration, {
            examSessionId: sessionId,
            fullName: dto.fullName.trim(),
            email,
            phone: dto.phone?.trim() || undefined,
            message: dto.message?.trim() || undefined,
            status: 'pending',
          }),
        );
        return { registration: created, session: locked };
      },
    );

    await this.notify(
      email,
      'Exam registration received',
      `Dear ${registration.fullName},\n\nWe received your registration request for the exam on ${this.formatDate(session.examDate)}. Our team will review it and contact you shortly.\n\nOrizzonti Training & Consulting`,
    );
    return {
      id: registration.id,
      status: registration.status,
      message: 'Registration request received. We will contact you shortly.',
    };
  }

  async findAll(filter: { examSessionId?: number; status?: string } = {}) {
    const query = this.registrationRepository
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.examSession', 's')
      .leftJoinAndSelect('s.level', 'l')
      .leftJoinAndSelect('l.language', 'lang')
      .orderBy('r.createdAt', 'DESC');
    if (filter.examSessionId) {
      query.andWhere('r.examSessionId = :sid', { sid: filter.examSessionId });
    }
    if (filter.status) {
      query.andWhere('r.status = :status', { status: filter.status });
    }
    return (await query.getMany()).map((r) => ({
      id: r.id,
      fullName: r.fullName,
      email: r.email,
      phone: r.phone,
      message: r.message,
      status: r.status,
      createdAt: r.createdAt,
      examSessionId: r.examSessionId,
      examDate: r.examSession?.examDate,
      location: r.examSession?.location,
      cefrLevel: r.examSession?.level?.cefrLevel,
      languageName: r.examSession?.level?.language?.name,
    }));
  }

  async updateStatus(id: number, status: ExamRegistrationStatus) {
    const { registration, session, changed } =
      await this.dataSource.transaction(async (manager) => {
        const existing = await manager.findOne(ExamRegistration, {
          where: { id },
        });
        if (!existing) {
          throw new NotFoundException('Registration not found');
        }
        const lockedSession = await manager.findOne(ExamSession, {
          where: { id: existing.examSessionId },
          lock: { mode: 'pessimistic_write' },
        });
        if (!lockedSession) {
          throw new NotFoundException('Exam session not found');
        }
        const reactivating =
          existing.status === 'rejected' && status !== 'rejected';
        if (reactivating && lockedSession.maxParticipants != null) {
          const held = await this.countHeld(manager, lockedSession.id);
          if (held >= lockedSession.maxParticipants) {
            throw new ConflictException('No places left for this exam');
          }
        }
        const didChange = existing.status !== status;
        existing.status = status;
        return {
          registration: await manager.save(existing),
          session: lockedSession,
          changed: didChange,
        };
      });

    if (changed && status !== 'pending') {
      const accepted = status === 'accepted';
      await this.notify(
        registration.email,
        accepted ? 'Exam registration accepted' : 'Exam registration declined',
        accepted
          ? `Dear ${registration.fullName},\n\nYour registration for the exam on ${this.formatDate(session.examDate)} has been accepted. A place is reserved for you.\n\nOrizzonti Training & Consulting`
          : `Dear ${registration.fullName},\n\nWe are sorry, your registration for the exam on ${this.formatDate(session.examDate)} could not be accepted. Please contact us for alternatives.\n\nOrizzonti Training & Consulting`,
      );
    }
    return registration;
  }

  async remove(id: number) {
    const existing = await this.registrationRepository.findOne({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException('Registration not found');
    }
    await this.registrationRepository.remove(existing);
    return { deleted: true, id };
  }

  private countHeld(manager: EntityManager, sessionId: number) {
    return manager.count(ExamRegistration, {
      where: { examSessionId: sessionId, status: In(HELD_STATUSES) },
    });
  }

  private formatDate(date: Date): string {
    return new Date(date).toISOString().slice(0, 10);
  }

  private async notify(to: string, subject: string, text: string) {
    try {
      await this.mailer.sendMail({ to, subject, text });
    } catch {
      this.logger.error(`Failed to send "${subject}" email.`);
    }
  }
}
