import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LanguageLevel } from './language-level.entity';
import { Language } from './language.entity';
import { CreateLanguageLevelDto } from './dto/create-language-level.dto';
import { UpdateLanguageLevelDto } from './dto/update-language-level.dto';

@Injectable()
export class LanguageLevelService {
  constructor(
    @InjectRepository(LanguageLevel)
    private readonly languageLevelRepository: Repository<LanguageLevel>,
    @InjectRepository(Language)
    private readonly languageRepository: Repository<Language>,
  ) {}

  async findByLanguageId(languageId: number) {
    const language = await this.languageRepository.findOne({
      where: { id: languageId },
      relations: ['levels', 'levels.examSessions'],
    });

    if (!language) {
      throw new NotFoundException('Language not found');
    }

    return language.levels || [];
  }

  async findOne(languageId: number, levelId: number) {
    const level = await this.languageLevelRepository.findOne({
      where: { id: levelId, languageId },
      relations: ['examSessions'],
    });

    if (!level) {
      throw new NotFoundException('Language level not found');
    }

    return level;
  }

  async create(languageId: number, dto: CreateLanguageLevelDto) {
    // Verify language exists
    const language = await this.languageRepository.findOne({
      where: { id: languageId },
    });

    if (!language) {
      throw new NotFoundException('Language not found');
    }

    // Check for duplicate level
    const existing = await this.languageLevelRepository.findOne({
      where: { languageId, cefrLevel: dto.cefrLevel },
    });

    if (existing) {
      throw new ConflictException(
        `Level ${dto.cefrLevel} already exists for this language`,
      );
    }

    const level = this.languageLevelRepository.create({
      languageId,
      cefrLevel: dto.cefrLevel,
      price: dto.price,
      courseHours: dto.courseHours,
      isActive: dto.isActive ?? true,
    });

    return this.languageLevelRepository.save(level);
  }

  async update(
    languageId: number,
    levelId: number,
    dto: UpdateLanguageLevelDto,
  ) {
    const level = await this.findOne(languageId, levelId);

    // Check for duplicate level if cefrLevel is being changed
    if (dto.cefrLevel && dto.cefrLevel !== level.cefrLevel) {
      const existing = await this.languageLevelRepository.findOne({
        where: { languageId, cefrLevel: dto.cefrLevel },
      });

      if (existing) {
        throw new ConflictException(
          `Level ${dto.cefrLevel} already exists for this language`,
        );
      }
    }

    Object.assign(level, dto);
    return this.languageLevelRepository.save(level);
  }

  async delete(languageId: number, levelId: number) {
    const level = await this.findOne(languageId, levelId);
    await this.languageLevelRepository.remove(level);
    return { deleted: true, id: levelId };
  }
}
