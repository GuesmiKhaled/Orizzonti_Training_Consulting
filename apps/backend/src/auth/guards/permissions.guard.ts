import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthService } from '../auth.service';
import {
  ALLOW_PENDING_PASSWORD_CHANGE_KEY,
  REQUIRED_PERMISSION_KEY,
} from '../auth.constants';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    if (!request.authUserId) return true;

    const user = await this.authService.getUserAccess(request.authUserId);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Admin account is inactive or missing');
    }

    request.user = user;

    const allowsPendingChange = this.reflector.getAllAndOverride<boolean>(
      ALLOW_PENDING_PASSWORD_CHANGE_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (user.mustChangePassword === true && allowsPendingChange !== true) {
      throw new ForbiddenException('Password change required');
    }
    const requiredPermission = this.reflector.getAllAndOverride<
      string | string[]
    >(REQUIRED_PERMISSION_KEY, [context.getHandler(), context.getClass()]);

    const requiredPermissions = Array.isArray(requiredPermission)
      ? requiredPermission
      : requiredPermission
        ? [requiredPermission]
        : [];
    if (
      requiredPermissions.length > 0 &&
      !requiredPermissions.some((permission) =>
        user.permissions.includes(permission),
      )
    ) {
      throw new ForbiddenException('Insufficient permission');
    }
    return true;
  }
}
