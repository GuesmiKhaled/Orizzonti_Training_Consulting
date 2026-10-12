import { Body, Controller, Get, Patch } from '@nestjs/common';
import { SettingsService } from './settings.service';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('mail')
  getMailSettings() {
    return this.settingsService.getMailSettings();
  }

  @Patch('mail')
  updateMailSettings(@Body() dto: any) {
    return this.settingsService.updateMailSettings(dto);
  }
}
