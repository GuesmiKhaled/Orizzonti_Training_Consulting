import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MailSettings } from './mail-settings.entity';
import { UpdateMailSettingsDto } from './dto/update-mail-settings.dto';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(MailSettings)
    private readonly mailSettingsRepository: Repository<MailSettings>,
  ) {}

  async getMailSettings() {
    return this.toSafeSettings(await this.getOrCreateMailSettings());
  }

  async updateMailSettings(dto: UpdateMailSettingsDto) {
    const settings = await this.getOrCreateMailSettings();
    const values = { ...dto };
    if (!values.password) delete values.password;
    const updated = this.mailSettingsRepository.merge(settings, values);
    return this.toSafeSettings(await this.mailSettingsRepository.save(updated));
  }

  private async getOrCreateMailSettings(): Promise<MailSettings> {
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

  private toSafeSettings(settings: MailSettings) {
    const { password, ...safeSettings } = settings;
    return { ...safeSettings, passwordConfigured: Boolean(password) };
  }
}
