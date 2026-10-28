import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import * as jwt from 'jsonwebtoken';
import { AuthService } from './auth.service';
import { LOGIN_THROTTLE, PASSWORD_CHANGE_THROTTLE } from '../throttling';
import {
  ACCESS_TOKEN_COOKIE,
  CSRF_COOKIE,
  REFRESH_TOKEN_COOKIE,
  REFRESH_TOKEN_TTL_SECONDS,
  ACCESS_TOKEN_TTL_SECONDS,
  cookieOptions,
  csrfCookieOptions,
  getRefreshTokenSecret,
} from './auth.constants';
import { LoginDto } from './dto/login.dto';
import { AllowPendingPasswordChange } from './decorators/allow-pending-password-change.decorator';
import { Public } from './decorators/public.decorator';
import { RequirePermission } from './decorators/require-permission.decorator';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CreateAdminUserDto } from './dto/create-admin-user.dto';
import { ListAdminUsersDto } from './dto/list-admin-users.dto';
import { UpdateAdminUserDto } from './dto/update-admin-user.dto';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @Public()
  @Throttle(LOGIN_THROTTLE)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(dto.username, dto.password);
    this.setAuthCookies(res, result.accessToken, result.refreshToken);
    return { user: result.user };
  }

  @Post('refresh')
  @Public()
  @Throttle(LOGIN_THROTTLE)
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = request.cookies?.[REFRESH_TOKEN_COOKIE];
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token required');
    }
    const result = await this.authService.refresh(refreshToken);
    this.setAuthCookies(res, result.accessToken, result.refreshToken);
    return { user: result.user };
  }

  @Post('logout')
  @Public()
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = request.cookies?.[REFRESH_TOKEN_COOKIE];
    if (refreshToken) {
      try {
        const payload = jwt.verify(
          refreshToken,
          getRefreshTokenSecret(),
        ) as jwt.JwtPayload;
        if (payload.jti) {
          await this.authService.revokeRefreshToken(payload.jti);
        }
      } catch {
        // Token invalid/expired — nothing to revoke; still clear cookies.
      }
    }
    this.clearAuthCookies(res);
    return { success: true };
  }

  @Get('csrf')
  @Public()
  csrf(@Res({ passthrough: true }) res: Response) {
    const token = randomUUID();
    res.cookie(CSRF_COOKIE, token, csrfCookieOptions());
    return { token };
  }

  @Get('roles')
  @RequirePermission(['manage_users', 'manage_roles'])
  getRoles() {
    return this.authService.getRoles();
  }

  @Get('profile')
  @AllowPendingPasswordChange()
  getProfile(@Req() request: { authUserId: number }) {
    return this.authService.getProfile(request.authUserId);
  }

  @Post('change-password')
  @AllowPendingPasswordChange()
  @Throttle(PASSWORD_CHANGE_THROTTLE)
  changePassword(
    @Body() dto: ChangePasswordDto,
    @Req() request: { authUserId: number },
  ) {
    return this.authService.changePassword(request.authUserId, dto);
  }

  @Get('permissions')
  @RequirePermission('manage_roles')
  getPermissions() {
    return this.authService.getPermissions();
  }

  @Get('users')
  @RequirePermission('manage_users')
  listUsers(@Query() query: ListAdminUsersDto) {
    return this.authService.listUsers(query);
  }

  @Post('users')
  @RequirePermission('manage_users')
  createUser(
    @Body() dto: CreateAdminUserDto,
    @Req() request: { authUserId: number },
  ) {
    return this.authService.createUser(dto, request.authUserId);
  }

  @Patch('users/:id')
  @RequirePermission('manage_users')
  updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAdminUserDto,
    @Req() request: { authUserId: number },
  ) {
    return this.authService.updateUser(id, dto, request.authUserId);
  }

  @Delete('users/:id')
  @RequirePermission('manage_users')
  deleteUser(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: { authUserId: number },
  ) {
    return this.authService.deleteUser(id, request.authUserId);
  }

  @Post('roles')
  @RequirePermission('manage_roles')
  createRole(@Body() dto: CreateRoleDto) {
    return this.authService.createRole(dto);
  }

  @Patch('roles/:id')
  @RequirePermission('manage_roles')
  updateRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRoleDto,
  ) {
    return this.authService.updateRole(id, dto);
  }

  @Delete('roles/:id')
  @RequirePermission('manage_roles')
  deleteRole(@Param('id', ParseIntPipe) id: number) {
    return this.authService.deleteRole(id);
  }

  private setAuthCookies(
    res: Response,
    accessToken: string,
    refreshToken: string,
  ): void {
    res.cookie(
      ACCESS_TOKEN_COOKIE,
      accessToken,
      cookieOptions(ACCESS_TOKEN_TTL_SECONDS),
    );
    res.cookie(
      REFRESH_TOKEN_COOKIE,
      refreshToken,
      cookieOptions(REFRESH_TOKEN_TTL_SECONDS),
    );
  }

  private clearAuthCookies(res: Response): void {
    const clearOpts = cookieOptions(0);
    res.clearCookie(ACCESS_TOKEN_COOKIE, clearOpts);
    res.clearCookie(REFRESH_TOKEN_COOKIE, clearOpts);
    res.clearCookie(CSRF_COOKIE, csrfCookieOptions());
  }
}
