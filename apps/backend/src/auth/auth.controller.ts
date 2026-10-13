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
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Public } from './decorators/public.decorator';
import { RequirePermission } from './decorators/require-permission.decorator';
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
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto.username, dto.password);
  }

  @Get('roles')
  @RequirePermission(['manage_users', 'manage_roles'])
  getRoles() {
    return this.authService.getRoles();
  }

  @Get('profile')
  getProfile(@Req() request: { authUserId: number }) {
    return this.authService.getProfile(request.authUserId);
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
}
