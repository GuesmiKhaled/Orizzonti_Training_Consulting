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
import { CourseService } from './course.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { Public } from '../auth/decorators/public.decorator';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';

@Controller('courses')
export class CourseController {
  constructor(private readonly courseService: CourseService) {}

  @Get()
  @Public()
  findAll() {
    return this.courseService.findAll();
  }

  @Get(':id')
  @Public()
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.courseService.findOne(id);
  }

  @Post()
  @RequirePermission('manage_courses')
  create(@Body() dto: CreateCourseDto) {
    return this.courseService.create(dto);
  }

  @Patch(':id')
  @RequirePermission('manage_courses')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<CreateCourseDto>,
  ) {
    return this.courseService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermission('manage_courses')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.courseService.remove(id);
  }
}
