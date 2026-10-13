import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import * as jwt from 'jsonwebtoken';
import { getJwtSecret, PUBLIC_ROUTE_KEY } from '../auth.constants';

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

    if (scheme?.toLowerCase() !== 'bearer' || !token) {
      throw new UnauthorizedException('Bearer token required');
    }

    try {
      const payload = jwt.verify(token, getJwtSecret()) as jwt.JwtPayload;
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
