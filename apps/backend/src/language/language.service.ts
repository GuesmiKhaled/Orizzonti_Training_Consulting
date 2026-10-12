import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Language } from './language.entity';
import { CreateLanguageDto } from './dto/create-language.dto';

@Injectable()
export class LanguageService {
  constructor(
    @InjectRepository(Language)
    private readonly languageRepository: Repository<Language>,
  ) {}

  findAll() {
    return this.languageRepository.find({ order: { id: 'ASC' } });
  }

  async findOne(id: number) {
    const language = await this.languageRepository.findOne({ where: { id } });
    if (!language) {
      throw new NotFoundException('Language not found');
    }
    return language;
  }

  create(dto: CreateLanguageDto) {
    return this.languageRepository.save(this.languageRepository.create(dto));
  }

  async update(id: number, dto: Partial<CreateLanguageDto>) {
    const language = await this.languageRepository.preload({ id, ...dto });
    if (!language) {
      throw new NotFoundException('Language not found');
    }
    return this.languageRepository.save(language);
  }

  async remove(id: number) {
    const language = await this.findOne(id);
    await this.languageRepository.remove(language);
    return { deleted: true, id };
  }
}
