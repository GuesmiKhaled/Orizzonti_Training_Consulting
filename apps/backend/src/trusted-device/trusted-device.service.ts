import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, LessThan, MoreThan, Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'node:crypto';
import { TrustedDevice } from './trusted-device.entity';

const envInt = (key: string, fallback: number): number => {
  const raw = process.env[key];
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export const TRUSTED_DEVICE_EXPIRATION_DAYS = envInt(
  'TRUSTED_DEVICE_EXPIRATION_DAYS',
  30,
);

export interface DeviceMetadata {
  deviceName: string | null;
  browser: string | null;
  operatingSystem: string | null;
}

export interface CreatedTrustedDevice {
  deviceToken: string; // sent to client as cookie
  record: TrustedDevice;
}

@Injectable()
export class TrustedDeviceService {
  private readonly logger = new Logger(TrustedDeviceService.name);

  constructor(
    @InjectRepository(TrustedDevice)
    private readonly deviceRepository: Repository<TrustedDevice>,
  ) {}

  /** Parse User-Agent into device metadata. */
  parseUserAgent(ua: string | undefined): DeviceMetadata {
    if (!ua) return { deviceName: null, browser: null, operatingSystem: null };
    let browser = 'Unknown';
    let os = 'Unknown';
    if (/Edg\//.test(ua)) browser = 'Edge';
    else if (/Chrome\//.test(ua)) browser = 'Chrome';
    else if (/Firefox\//.test(ua)) browser = 'Firefox';
    else if (/Safari\//.test(ua)) browser = 'Safari';
    if (/Windows NT/.test(ua)) os = 'Windows';
    else if (/Mac OS X/.test(ua)) os = 'macOS';
    else if (/Android/.test(ua)) os = 'Android';
    else if (/iPhone|iPad/.test(ua)) os = 'iOS';
    else if (/Linux/.test(ua)) os = 'Linux';
    const isMobile = /Mobile|Android|iPhone|iPad/.test(ua);
    return {
      deviceName: `${browser} on ${os}${isMobile ? ' (Mobile)' : ''}`,
      browser,
      operatingSystem: os,
    };
  }

  /** Create a new trusted device record + token. */
  async create(
    userId: number,
    metadata: DeviceMetadata,
    ip: string | null,
  ): Promise<CreatedTrustedDevice> {
    const deviceToken = randomBytes(32).toString('hex');
    const deviceTokenHash = await bcrypt.hash(deviceToken, 10);
    const now = new Date();
    const expiresAt = new Date(
      now.getTime() + TRUSTED_DEVICE_EXPIRATION_DAYS * 24 * 60 * 60_000,
    );
    const record = await this.deviceRepository.save(
      this.deviceRepository.create({
        userId,
        deviceTokenHash,
        deviceName: metadata.deviceName,
        browser: metadata.browser,
        operatingSystem: metadata.operatingSystem,
        firstAuthenticatedAt: now,
        lastUsedAt: now,
        expiresAt,
        lastKnownIp: ip,
      }),
    );
    return { deviceToken, record };
  }

  /** Validate a device token cookie. Returns the device record if valid+trusted. */
  async validate(deviceToken: string): Promise<TrustedDevice | null> {
    const devices = await this.deviceRepository.find({
      where: { revokedAt: IsNull(), expiresAt: MoreThan(new Date()) },
    });
    for (const device of devices) {
      if (await bcrypt.compare(deviceToken, device.deviceTokenHash)) {
        // Update lastUsedAt
        await this.deviceRepository.update(device.id, {
          lastUsedAt: new Date(),
        });
        return device;
      }
    }
    return null;
  }

  /** List all trusted devices for a user (excluding revoked). */
  async listForUser(userId: number): Promise<TrustedDevice[]> {
    return this.deviceRepository.find({
      where: { userId, revokedAt: IsNull() },
      order: { lastUsedAt: 'DESC' },
    });
  }

  /** Revoke a trusted device by id. Only the owner can revoke. */
  async revoke(userId: number, deviceId: number): Promise<void> {
    const device = await this.deviceRepository.findOne({
      where: { id: deviceId, userId },
    });
    if (!device) throw new NotFoundException('Trusted device not found');
    await this.deviceRepository.update(deviceId, { revokedAt: new Date() });
  }

  /** Revoke all expired devices (cleanup). */
  async cleanupExpired(): Promise<void> {
    await this.deviceRepository.update(
      { expiresAt: LessThan(new Date()), revokedAt: IsNull() },
      { revokedAt: new Date() },
    );
  }
}
