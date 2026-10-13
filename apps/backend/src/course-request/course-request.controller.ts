import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { CourseRequestService } from './course-request.service';
import { CreateCourseRequestDto } from './dto/create-course-request.dto';
import { UpdateCourseRequestDto } from './dto/update-course-request.dto';
import { Public } from '../auth/decorators/public.decorator';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';

@Controller('course-requests')
export class CourseRequestController {
  constructor(private readonly courseRequestService: CourseRequestService) {}

  @Get()
  @RequirePermission('manage_course_requests')
  findAll() {
    return this.courseRequestService.findAll();
  }

  @Get(':id')
  @RequirePermission('manage_course_requests')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.courseRequestService.findOne(id);
  }

  @Post()
  @Public()
  create(@Body() dto: CreateCourseRequestDto) {
    return this.courseRequestService.create(dto);
  }

  @Patch(':id')
  @RequirePermission('manage_course_requests')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCourseRequestDto,
  ) {
    return this.courseRequestService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermission('manage_course_requests')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.courseRequestService.remove(id);
  }
}
