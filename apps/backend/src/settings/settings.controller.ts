import { Body, Controller, Get, Patch } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { UpdateMailSettingsDto } from './dto/update-mail-settings.dto';

@Controller('settings')
@RequirePermission('manage_mail_settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('mail')
  getMailSettings() {
    return this.settingsService.getMailSettings();
  }

  @Patch('mail')
  updateMailSettings(@Body() dto: UpdateMailSettingsDto) {
    return this.settingsService.updateMailSettings(dto);
  }
}
