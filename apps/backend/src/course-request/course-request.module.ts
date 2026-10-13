import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CourseRequest } from './course-request.entity';
import { CourseRequestController } from './course-request.controller';
import { CourseRequestService } from './course-request.service';

@Module({
  imports: [TypeOrmModule.forFeature([CourseRequest])],
  controllers: [CourseRequestController],
  providers: [CourseRequestService],
  exports: [CourseRequestService],
})
export class CourseRequestModule {}
