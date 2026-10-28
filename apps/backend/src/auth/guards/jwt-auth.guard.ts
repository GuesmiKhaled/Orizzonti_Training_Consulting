import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import * as jwt from 'jsonwebtoken';
import {
  ACCESS_TOKEN_COOKIE,
  CSRF_COOKIE,
  CSRF_HEADER,
  PUBLIC_ROUTE_KEY,
  getJwtSecret,
} from '../auth.constants';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(
      PUBLIC_ROUTE_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const authorization = request.headers.authorization;
    const [scheme, token] =
      typeof authorization === 'string' ? authorization.split(' ') : [];

    // Prefer the httpOnly cookie (audit finding #4); fall back to the
    // Authorization header for backward compatibility with API clients.
    const cookieToken = request.cookies?.[ACCESS_TOKEN_COOKIE];
    const bearerToken =
      scheme?.toLowerCase() === 'bearer' && token ? token : null;
    const accessToken = cookieToken ?? bearerToken;

    if (!accessToken) {
      throw new UnauthorizedException('Authentication required');
    }

    try {
      const payload = jwt.verify(accessToken, getJwtSecret()) as jwt.JwtPayload;
      const userId = Number(payload.sub);
      if (!Number.isInteger(userId) || userId < 1) {
        throw new UnauthorizedException('Invalid access token');
      }
      request.authUserId = userId;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired access token');
    }
  }
}

/**
 * Double-submit CSRF protection for state-changing requests. Required because
 * the auth cookies use SameSite=None (cross-origin), which disables the
 * browser's built-in SameSite CSRF defense. The client must send the
 * `x-csrf-token` header matching the `orizzonti_csrf` cookie value.
 *
 * Only applied to non-GET methods on authenticated routes. Public routes
 * (marked @Public) are exempt since they don't carry a CSRF token yet.
 */
@Injectable()
export class CsrfGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    // Only enforce on state-changing methods.
    if (
      request.method === 'GET' ||
      request.method === 'OPTIONS' ||
      request.method === 'HEAD'
    ) {
      return true;
    }
    const isPublic = this.reflector.getAllAndOverride<boolean>(
      PUBLIC_ROUTE_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (isPublic) return true;

    const cookieToken = request.cookies?.[CSRF_COOKIE];
    const headerToken = request.headers[CSRF_HEADER];
    if (
      !cookieToken ||
      typeof cookieToken !== 'string' ||
      !headerToken ||
      typeof headerToken !== 'string' ||
      cookieToken !== headerToken
    ) {
      throw new UnauthorizedException('CSRF token missing or invalid');
    }
    return true;
  }
}
