import { Body, Controller, Get, Patch } from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { UpdateSiteSettingsDto } from './dto/update-site-settings.dto';
import { SiteSettingsService } from './site-settings.service';

@Controller('site-settings')
export class SiteSettingsController {
  constructor(private readonly service: SiteSettingsService) {}

  /** Public: the website reads its editable content from here. */
  @Get()
  @Public()
  get() {
    return this.service.get();
  }

  @Patch()
  @RequirePermission('manage_site_settings')
  update(@Body() dto: UpdateSiteSettingsDto) {
    return this.service.update(dto);
  }
}
