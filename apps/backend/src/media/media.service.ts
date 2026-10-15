import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SliderMedia } from './media.entity';
import { CreateMediaDto, UpdateMediaDto } from './dto/create-media.dto';

@Injectable()
export class MediaService {
  constructor(
    @InjectRepository(SliderMedia)
    private readonly mediaRepository: Repository<SliderMedia>,
  ) {}

  findAll() {
    return this.mediaRepository.find({ order: { createdAt: 'DESC' } });
  }

  create(dto: CreateMediaDto) {
    return this.mediaRepository.save(this.mediaRepository.create(dto));
  }

  async update(id: number, dto: UpdateMediaDto) {
    const media = await this.mediaRepository.preload({ id, ...dto });
    if (!media) {
      throw new NotFoundException('Slider media not found');
    }
    return this.mediaRepository.save(media);
  }

  async remove(id: number) {
    const media = await this.mediaRepository.findOne({ where: { id } });
    if (!media) {
      throw new NotFoundException('Slider media not found');
    }
    await this.mediaRepository.remove(media);
    return { deleted: true, id };
  }
}
