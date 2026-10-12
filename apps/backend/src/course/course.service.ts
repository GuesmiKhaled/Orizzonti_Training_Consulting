import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Course } from './course.entity';
import { CreateCourseDto } from './dto/create-course.dto';

@Injectable()
export class CourseService {
  constructor(
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
  ) {}

  findAll() {
    return this.courseRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: number) {
    const course = await this.courseRepository.findOne({ where: { id } });
    if (!course) {
      throw new NotFoundException('Course not found');
    }
    return course;
  }

  create(dto: CreateCourseDto) {
    const course = this.courseRepository.create({
      ...dto,
      slug: dto.slug ?? dto.name.toLowerCase().replace(/\s+/g, '-'),
    });
    return this.courseRepository.save(course);
  }

  async update(id: number, dto: Partial<CreateCourseDto>) {
    const course = await this.courseRepository.preload({ id, ...dto });
    if (!course) {
      throw new NotFoundException('Course not found');
    }
    return this.courseRepository.save(course);
  }

  async remove(id: number) {
    const course = await this.findOne(id);
    await this.courseRepository.remove(course);
    return { deleted: true, id };
  }
}
