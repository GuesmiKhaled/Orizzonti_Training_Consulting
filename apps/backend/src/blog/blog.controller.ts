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
import { BlogService } from './blog.service';
import { CreateBlogDto } from './dto/create-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';
import { Public } from '../auth/decorators/public.decorator';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';

@Controller('blogs')
export class BlogController {
  constructor(private readonly blogService: BlogService) {}

  @Get()
  @Public()
  findPublished() {
    return this.blogService.findPublished();
  }

  @Get('manage')
  @RequirePermission('manage_blog')
  findAllForAdmin() {
    return this.blogService.findAll();
  }

  @Get('manage/:id')
  @RequirePermission('manage_blog')
  findOneForAdmin(@Param('id', ParseIntPipe) id: number) {
    return this.blogService.findOne(id);
  }

  @Get(':id')
  @Public()
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.blogService.findPublishedOne(id);
  }

  @Post()
  @RequirePermission('manage_blog')
  create(@Body() dto: CreateBlogDto) {
    return this.blogService.create(dto);
  }

  @Patch(':id')
  @RequirePermission('manage_blog')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBlogDto,
  ) {
    return this.blogService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermission('manage_blog')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.blogService.remove(id);
  }
}
