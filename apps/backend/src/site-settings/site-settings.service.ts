import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UpdateSiteSettingsDto } from './dto/update-site-settings.dto';
import { SiteSettings } from './site-settings.entity';

@Injectable()
export class SiteSettingsService {
  constructor(
    @InjectRepository(SiteSettings)
    private readonly repository: Repository<SiteSettings>,
  ) {}

  async get(): Promise<SiteSettings> {
    const [existing] = await this.repository.find({
      order: { id: 'ASC' },
      take: 1,
    });
    return existing ?? this.repository.save(this.repository.create({}));
  }

  async update(dto: UpdateSiteSettingsDto): Promise<SiteSettings> {
    const settings = await this.get();
    const { nextSessionDate, ...rest } = dto;
    this.repository.merge(settings, rest);
    if (nextSessionDate !== undefined) {
      settings.nextSessionDate = nextSessionDate ? new Date(nextSessionDate) : null;
    }
    return this.repository.save(settings);
  }
}
