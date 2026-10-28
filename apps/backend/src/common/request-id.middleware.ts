import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'node:crypto';

/**
 * Attaches a correlation id to every request and echoes it on the response
 * via `X-Request-Id`. An incoming `X-Request-Id` header is honored so traces
 * can be propagated from upstream proxies. Addresses audit finding #8
 * (no structured logging / correlation IDs) at the transport layer; loggers
 * can read `req.headers['x-request-id']` to include it in log entries.
 */
@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const incoming = req.headers['x-request-id'];
    const id =
      typeof incoming === 'string' && incoming.trim()
        ? incoming.trim()
        : randomUUID();
    req.headers['x-request-id'] = id;
    res.setHeader('X-Request-Id', id);
    next();
  }
}
