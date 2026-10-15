import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Blog } from './blog/blog.entity';
import { Course } from './course/course.entity';
import { CourseRequest } from './course-request/course-request.entity';
import { Language } from './language/language.entity';
import { SliderMedia } from './media/media.entity';
import { AdminUser } from './auth/admin-user.entity';

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
    @InjectRepository(AdminUser)
    private readonly adminUserRepository: Repository<AdminUser>,
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
      adminUsersCount,
      byCourse,
      latest,
    ] = await Promise.all([
      this.blogRepository.count(),
      this.courseRepository.count(),
      this.languageRepository.count(),
      this.sliderMediaRepository.count(),
      this.courseRequestRepository.count(),
      this.courseRequestRepository.count({ where: { status: 'new' } }),
      this.adminUserRepository.count(),
      this.courseRequestRepository
        .createQueryBuilder('r')
        .select('r.courseName', 'name')
        .addSelect('COUNT(*)', 'count')
        .groupBy('r.courseName')
        .orderBy('COUNT(*)', 'DESC')
        .limit(5)
        .getRawMany<{ name: string; count: string }>(),
      this.courseRequestRepository.find({
        order: { createdAt: 'DESC' },
        take: 5,
      }),
    ]);

    return {
      blogsCount,
      coursesCount,
      languagesCount,
      sliderCount,
      courseRequestsCount,
      newCourseRequestsCount,
      adminUsersCount,
      requestsByCourse: byCourse.map((row) => ({
        name: row.name,
        count: Number(row.count),
      })),
      latestRequests: latest.map((request) => ({
        id: request.id,
        applicant: abbreviateName(request.fullName),
        courseName: request.courseName,
        status: request.status,
        createdAt: request.createdAt,
      })),
    };
  }
}

/** "Sana Ben Ali" -> "Sana B." so the dashboard does not expose full names. */
export function abbreviateName(fullName: string): string {
  const [first = '', ...rest] = fullName.trim().split(/\s+/);
  const second = rest[0];
  return second ? `${first} ${second.charAt(0).toUpperCase()}.` : first;
}
