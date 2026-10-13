import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Blog } from './blog/blog.entity';
import { Course } from './course/course.entity';
import { CourseRequest } from './course-request/course-request.entity';
import { Language } from './language/language.entity';
import { SliderMedia } from './media/media.entity';

@Injectable()
export class AppService {
  constructor(
    @InjectRepository(Blog)
    private readonly blogRepository: Repository<Blog>,
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
    @InjectRepository(Language)
    private readonly languageRepository: Repository<Language>,
    @InjectRepository(SliderMedia)
    private readonly sliderMediaRepository: Repository<SliderMedia>,
    @InjectRepository(CourseRequest)
    private readonly courseRequestRepository: Repository<CourseRequest>,
  ) {}

  getHello(): string {
    return 'Hello World!';
  }

  async getDashboardStats() {
    const [
      blogsCount,
      coursesCount,
      languagesCount,
      sliderCount,
      courseRequestsCount,
      newCourseRequestsCount,
    ] = await Promise.all([
      this.blogRepository.count(),
      this.courseRepository.count(),
      this.languageRepository.count(),
      this.sliderMediaRepository.count(),
      this.courseRequestRepository.count(),
      this.courseRequestRepository.count({ where: { status: 'new' } }),
    ]);

    return {
      blogsCount,
      coursesCount,
      languagesCount,
      sliderCount,
      courseRequestsCount,
      newCourseRequestsCount,
    };
  }
}
