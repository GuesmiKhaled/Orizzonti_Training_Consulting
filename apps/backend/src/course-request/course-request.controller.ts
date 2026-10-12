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

@Controller('course-requests')
export class CourseRequestController {
  constructor(private readonly courseRequestService: CourseRequestService) {}

  @Get()
  findAll() {
    return this.courseRequestService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.courseRequestService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateCourseRequestDto) {
    return this.courseRequestService.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCourseRequestDto,
  ) {
    return this.courseRequestService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.courseRequestService.remove(id);
  }
}
