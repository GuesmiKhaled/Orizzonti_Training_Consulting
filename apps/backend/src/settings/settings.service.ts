import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MailSettings } from './mail-settings.entity';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(MailSettings)
    private readonly mailSettingsRepository: Repository<MailSettings>,
  ) {}

  async getMailSettings() {
    const [latestSettings] = await this.mailSettingsRepository.find({
      order: { id: 'DESC' },
      take: 1,
    });
    let settings = latestSettings;
    if (!settings) {
      settings = await this.mailSettingsRepository.save(
        this.mailSettingsRepository.create({
          host: process.env.SMTP_HOST ?? 'smtp.example.com',
          port: Number(process.env.SMTP_PORT ?? 587),
          username: process.env.SMTP_USER ?? 'info@orizzonti.tn',
          password: process.env.SMTP_PASSWORD ?? '',
          fromAddress: process.env.SMTP_FROM ?? 'info@orizzonti.tn',
          secure: true,
        }),
      );
    }
    return settings;
  }

  async updateMailSettings(dto: Partial<MailSettings>) {
    const settings = await this.getMailSettings();
    const updated = this.mailSettingsRepository.merge(settings, dto);
    return this.mailSettingsRepository.save(updated);
  }
}
