import { PartialType } from '@nestjs/mapped-types';
import { CreateCourseRequestDto } from './create-course-request.dto';

export class UpdateCourseRequestDto extends PartialType(
  CreateCourseRequestDto,
) {}
