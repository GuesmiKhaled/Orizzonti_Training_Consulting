import {
  Controller,
  Get,
  ServiceUnavailableException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Public } from '../auth/decorators/public.decorator';

/**
 * Liveness and readiness endpoints for orchestrators (Docker / load
 * balancers). Addresses audit finding #7 (no health/readiness endpoint).
 *
 * - `GET /health` is liveness: returns 200 as long as the process is up.
 * - `GET /health/ready` is readiness: returns 200 only when the database
 *   is reachable, otherwise 503 with the error detail.
 *
 * Both routes are public so probes do not need credentials.
 */
@Controller('health')
export class HealthController {
  constructor(private readonly dataSource: DataSource) {}

  @Get()
  @Public()
  liveness() {
    return { status: 'ok' };
  }

  @Get('ready')
  @Public()
  async readiness() {
    try {
      await this.dataSource.query('SELECT 1');
      return { status: 'ok', database: 'up' };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Database unreachable';
      throw new ServiceUnavailableException(
        `Database health check failed: ${message}`,
      );
    }
  }
}
