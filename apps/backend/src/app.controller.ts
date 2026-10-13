import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { Public } from './auth/decorators/public.decorator';
import { RequirePermission } from './auth/decorators/require-permission.decorator';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @Public()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('dashboard/stats')
  @RequirePermission('view_dashboard')
  getDashboardStats() {
    return this.appService.getDashboardStats();
  }
}
