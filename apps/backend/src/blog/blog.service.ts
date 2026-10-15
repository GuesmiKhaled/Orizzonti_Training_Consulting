import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Blog } from './blog.entity';
import { CreateBlogDto } from './dto/create-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';

@Injectable()
export class BlogService {
  constructor(
    @InjectRepository(Blog)
    private readonly blogRepository: Repository<Blog>,
  ) {}

  findAll() {
    return this.blogRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: number) {
    const blog = await this.blogRepository.findOne({ where: { id } });
    if (!blog) {
      throw new NotFoundException('Blog not found');
    }
    return blog;
  }

  create(dto: CreateBlogDto) {
    const blog = this.blogRepository.create({
      ...dto,
      slug: dto.slug ?? dto.title.toLowerCase().replace(/\s+/g, '-'),
    });
    return this.blogRepository.save(blog);
  }

  async update(id: number, dto: UpdateBlogDto) {
    const blog = await this.blogRepository.preload({ id, ...dto });
    if (!blog) {
      throw new NotFoundException('Blog not found');
    }
    return this.blogRepository.save(blog);
  }

  async remove(id: number) {
    const blog = await this.findOne(id);
    await this.blogRepository.remove(blog);
    return { deleted: true, id };
  }
}
