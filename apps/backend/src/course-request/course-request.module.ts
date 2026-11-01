import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CourseRequest } from './course-request.entity';
import { CourseRequestController } from './course-request.controller';
import { CourseRequestService } from './course-request.service';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [TypeOrmModule.forFeature([CourseRequest]), NotificationModule],
  controllers: [CourseRequestController],
  providers: [CourseRequestService],
  exports: [CourseRequestService],
})
export class CourseRequestModule {}
