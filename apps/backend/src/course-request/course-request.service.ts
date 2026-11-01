import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CourseRequest } from './course-request.entity';
import { CreateCourseRequestDto } from './dto/create-course-request.dto';
import { UpdateCourseRequestDto } from './dto/update-course-request.dto';
import { NotificationService } from '../notification/notification.service';
import { courseReservationEmailTemplate } from '../notification/email-templates';

@Injectable()
export class CourseRequestService {
  constructor(
    @InjectRepository(CourseRequest)
    private readonly courseRequestRepository: Repository<CourseRequest>,
    private readonly dataSource: DataSource,
    private readonly notifications: NotificationService,
  ) {}

  async findAll(): Promise<CourseRequest[]> {
    return this.courseRequestRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<CourseRequest> {
    const item = await this.courseRequestRepository.findOne({ where: { id } });
    if (!item) {
      throw new NotFoundException(`Course request #${id} not found`);
    }
    return item;
  }

  async create(payload: CreateCourseRequestDto): Promise<CourseRequest> {
    return this.dataSource.transaction(async (manager) => {
      const entity = manager.create(CourseRequest, {
        ...payload,
        status: payload.status ?? 'new',
      });
      const saved = await manager.save(entity);

      const template = courseReservationEmailTemplate({
        fullName: saved.fullName,
        courseName: saved.courseName,
        level: null,
        reservationReference: `CR-${saved.id}`,
        reservationDate: new Date(saved.createdAt).toISOString().slice(0, 10),
        startDate: null,
        status: saved.status,
      });
      try {
        await this.notifications.enqueue(manager, {
          recipient: saved.email,
          notificationType: 'course_reservation',
          relatedEntityId: saved.id,
          subject: template.subject,
          htmlBody: template.html,
          textBody: template.text,
        });
      } catch {
        // Enqueue failure must not block the reservation.
      }
      return saved;
    });
  }

  async update(
    id: number,
    payload: UpdateCourseRequestDto,
  ): Promise<CourseRequest> {
    const existing = await this.findOne(id);
    Object.assign(existing, payload);
    return this.courseRequestRepository.save(existing);
  }

  async remove(id: number): Promise<{ deleted: boolean; id: number }> {
    const existing = await this.findOne(id);
    await this.courseRequestRepository.remove(existing);
    return { deleted: true, id };
  }
}
