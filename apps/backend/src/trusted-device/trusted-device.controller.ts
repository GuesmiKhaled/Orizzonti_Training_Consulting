import { Controller, Delete, Get, Param, ParseIntPipe, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { TrustedDeviceService } from './trusted-device.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('auth/trusted-devices')
@UseGuards(JwtAuthGuard)
export class TrustedDeviceController {
  constructor(private readonly trustedDeviceService: TrustedDeviceService) {}

  @Get()
  async list(@Req() req: Request) {
    const userId = (req.user as { id: number }).id;
    const devices = await this.trustedDeviceService.listForUser(userId);
    return devices.map((d) => ({
      id: d.id,
      deviceName: d.deviceName,
      browser: d.browser,
      operatingSystem: d.operatingSystem,
      firstAuthenticatedAt: d.firstAuthenticatedAt,
      lastUsedAt: d.lastUsedAt,
      expiresAt: d.expiresAt,
      lastKnownIp: d.lastKnownIp,
    }));
  }

  @Delete(':id')
  async revoke(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
  ) {
    const userId = (req.user as { id: number }).id;
    await this.trustedDeviceService.revoke(userId, id);
    return { success: true };
  }
}
