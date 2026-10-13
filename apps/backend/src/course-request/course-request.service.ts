import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CourseRequest } from './course-request.entity';
import { CreateCourseRequestDto } from './dto/create-course-request.dto';
import { UpdateCourseRequestDto } from './dto/update-course-request.dto';

@Injectable()
export class CourseRequestService {
  constructor(
    @InjectRepository(CourseRequest)
    private readonly courseRequestRepository: Repository<CourseRequest>,
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
    const entity = this.courseRequestRepository.create({
      ...payload,
      status: payload.status ?? 'new',
    });
    return this.courseRequestRepository.save(entity);
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
