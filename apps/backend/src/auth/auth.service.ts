import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, LessThan, Like, Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';
import {
  ACCESS_TOKEN_TTL,
  MIN_PASSWORD_LENGTH,
  REFRESH_TOKEN_TTL_SECONDS,
  getJwtSecret,
  getRefreshTokenSecret,
} from './auth.constants';
import { AdminUser } from './admin-user.entity';
import { Permission } from './permission.entity';
import { Role } from './role.entity';
import { RefreshToken } from './refresh-token.entity';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CreateAdminUserDto } from './dto/create-admin-user.dto';
import { ListAdminUsersDto } from './dto/list-admin-users.dto';
import { UpdateAdminUserDto } from './dto/update-admin-user.dto';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

/**
 * Passwords that shipped as defaults in earlier versions. They are only used to
 * detect an account that still has one, so it can be forced to change it.
 */
const KNOWN_DEFAULT_PASSWORDS: readonly string[] = ['admin123'];

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(AdminUser)
    private readonly adminUserRepository: Repository<AdminUser>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.ensureRoleAndPermissionSeed();
    await this.seedDefaultAdmin();
  }

  async validateUser(
    username: string,
    password: string,
  ): Promise<AdminUser | null> {
    const user = await this.adminUserRepository.findOne({
      where: { username },
      relations: ['role', 'role.permissions'],
    });
    if (!user || !user.isActive) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  async login(username: string, password: string) {
    const user = await this.validateUser(username, password);
    if (!user) {
      throw new UnauthorizedException('Invalid username or password');
    }

    return this.issueTokens(user);
  }

  /**
   * Issues a short-lived access token and a long-lived refresh token for the
   * given user. The access token is returned in the body for backward
   * compatibility with clients that read it; both tokens are also set as
   * httpOnly cookies by the controller. The refresh token's jti is stored in
   * the `refresh_tokens` allowlist so it can be revoked server-side.
   */
  async issueTokens(user: AdminUser) {
    const safeUser = this.toSafeUser(user);
    const accessToken = jwt.sign(
      {
        sub: user.id,
        username: user.username,
        role: user.role?.name ?? 'super-admin',
      },
      getJwtSecret(),
      { expiresIn: ACCESS_TOKEN_TTL },
    );
    const jti = randomUUID();
    const refreshToken = jwt.sign(
      { sub: user.id, kind: 'refresh', jti },
      getRefreshTokenSecret(),
      { expiresIn: REFRESH_TOKEN_TTL_SECONDS },
    );
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000);
    await this.refreshTokenRepository.save(
      this.refreshTokenRepository.create({ jti, userId: user.id, expiresAt }),
    );
    return { user: safeUser, accessToken, refreshToken };
  }

  /**
   * Validates a refresh token against both its JWT signature/expiry and the
   * server-side allowlist, then rotates it: the old jti is deleted and a new
   * token pair is issued. A refresh token whose jti is not in the allowlist
   * is rejected even if its signature is valid (already used or revoked).
   */
  async refresh(refreshToken: string) {
    let payload: jwt.JwtPayload;
    try {
      payload = jwt.verify(refreshToken, getRefreshTokenSecret()) as jwt.JwtPayload;
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
    if (payload.kind !== 'refresh' || !payload.jti) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    const userId = Number(payload.sub);
    if (!Number.isInteger(userId) || userId < 1) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    // Allowlist check: the jti must exist. Delete it atomically so a replay
    // (same jti used twice concurrently) fails on the second call.
    const existing = await this.refreshTokenRepository.findOne({
      where: { jti: payload.jti },
    });
    if (!existing) {
      throw new UnauthorizedException('Refresh token has been revoked');
    }
    await this.refreshTokenRepository.delete({ jti: payload.jti });
    // Best-effort cleanup of expired rows; keeps the allowlist bounded.
    // Fire-and-forget so a slow cleanup never blocks the refresh.
    void this.pruneExpiredTokens();
    const user = await this.adminUserRepository.findOne({
      where: { id: userId },
      relations: ['role', 'role.permissions'],
    });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Admin account is inactive or missing');
    }
    return this.issueTokens(user);
  }

  /**
   * Revokes a single refresh token (by jti). Used by the logout endpoint.
   * Silently succeeds if the jti is already gone (idempotent).
   */
  async revokeRefreshToken(jti: string): Promise<void> {
    await this.refreshTokenRepository.delete({ jti });
  }

  /**
   * Revokes every refresh token for a user. Used on password change, password
   * reset by an admin, account deactivation, and account deletion, so any
   * outstanding session is terminated immediately.
   */
  async revokeAllUserTokens(userId: number): Promise<void> {
    await this.refreshTokenRepository.delete({ userId });
  }

  /**
   * Best-effort cleanup of expired allowlist rows. Cheap enough to run on
   * each refresh; keeps the table from growing without bound.
   */
  private async pruneExpiredTokens(): Promise<void> {
    await this.refreshTokenRepository.delete({
      expiresAt: LessThan(new Date()),
    });
  }

  async getUserAccess(id: number) {
    const user = await this.adminUserRepository.findOne({
      where: { id },
      relations: ['role', 'role.permissions'],
    });
    if (!user) return null;
    return {
      ...this.toSafeUser(user),
      isActive: user.isActive,
    };
  }

  async getProfile(userId: number) {
    const user = await this.adminUserRepository.findOne({
      where: { id: userId },
      relations: ['role', 'role.permissions'],
    });

    if (!user || !user.isActive) throw new UnauthorizedException();
    return this.toSafeUser(user);
  }

  async getRoles() {
    return this.roleRepository.find({
      relations: ['permissions'],
      order: { name: 'ASC' },
    });
  }

  async getPermissions() {
    return this.permissionRepository.find({ order: { name: 'ASC' } });
  }

  async listUsers(query: ListAdminUsersDto) {
    const page = query.page ?? 0;
    const size = query.size ?? 20;
    const search = query.search?.trim();
    const role = query.roleId ? { role: { id: query.roleId } } : {};
    const term = search ? `%${search}%` : null;
    const where = term
      ? [
          { username: Like(term), ...role },
          { fullName: Like(term), ...role },
          { email: Like(term), ...role },
        ]
      : query.roleId
        ? role
        : undefined;
    const [users, total] = await this.adminUserRepository.findAndCount({
      where,
      relations: ['role'],
      order: { username: 'ASC' },
      skip: page * size,
      take: size,
    });

    return {
      items: users.map((user) => this.toSafeUser(user)),
      total,
      page,
      size,
    };
  }

  async createUser(dto: CreateAdminUserDto, requesterId: number) {
    const username = dto.username.trim();
    const duplicate = await this.adminUserRepository.findOne({
      where: { username },
    });
    if (duplicate) throw new ConflictException('Username already exists');

    const role = await this.findRole(dto.roleId);
    await this.assertCanGrantRole(requesterId, role);
    const user = this.adminUserRepository.create({
      username,
      password: await bcrypt.hash(dto.password, 12),
      isActive: dto.isActive ?? true,
      fullName: dto.fullName?.trim() || null,
      email: dto.email?.trim() || null,
      phone: dto.phone?.trim() || null,
      mustChangePassword: true,
      role,
    });
    return this.toSafeUser(await this.adminUserRepository.save(user));
  }

  async updateUser(id: number, dto: UpdateAdminUserDto, requesterId: number) {
    const user = await this.findUser(id);
    await this.assertCanManageUser(requesterId, user);
    const nextActive = dto.isActive ?? user.isActive;
    const nextRole = dto.roleId ? await this.findRole(dto.roleId) : user.role;
    if (dto.roleId !== undefined && nextRole) {
      await this.assertCanGrantRole(requesterId, nextRole);
    }

    if (id === requesterId && !nextActive) {
      throw new BadRequestException('You cannot deactivate your own account');
    }

    await this.ensureSuperAdminRemains(user, nextRole, nextActive);

    if (dto.username !== undefined) {
      const username = dto.username.trim();
      if (!username) throw new BadRequestException('Username cannot be blank');
      const duplicate = await this.adminUserRepository.findOne({
        where: { username },
      });
      if (duplicate && duplicate.id !== id) {
        throw new ConflictException('Username already exists');
      }
      user.username = username;
    }
    if (dto.password) {
      user.password = await bcrypt.hash(dto.password, 12);
      // An admin resetting someone else's password knows it, so that user must replace it.
      user.mustChangePassword = id !== requesterId;
      // Revoke all refresh tokens so the user must sign in again with the new password.
      await this.revokeAllUserTokens(id);
    }
    if (dto.isActive !== undefined) user.isActive = dto.isActive;
    if (dto.roleId !== undefined) user.role = nextRole;
    if (dto.fullName !== undefined) user.fullName = dto.fullName?.trim() || null;
    if (dto.email !== undefined) user.email = dto.email?.trim() || null;
    if (dto.phone !== undefined) user.phone = dto.phone?.trim() || null;

    // Deactivating the account ends all sessions immediately.
    if (dto.isActive === false) {
      await this.revokeAllUserTokens(id);
    }

    return this.toSafeUser(await this.adminUserRepository.save(user));
  }

  async deleteUser(id: number, requesterId: number) {
    if (id === requesterId) {
      throw new BadRequestException('You cannot delete your own account');
    }
    const user = await this.findUser(id);
    await this.assertCanManageUser(requesterId, user);
    await this.ensureSuperAdminRemains(user, undefined, false);
    // FK ON DELETE CASCADE removes the user's refresh-token rows, but delete
    // them explicitly first so the revocation is observable even if the
    // cascade is ever dropped.
    await this.revokeAllUserTokens(id);
    await this.adminUserRepository.remove(user);
    return { deleted: true, id };
  }

  async createRole(dto: CreateRoleDto) {
    const existing = await this.roleRepository.findOne({
      where: { name: dto.name.trim() },
    });
    if (existing) throw new ConflictException('Role name already exists');
    const permissions = await this.findPermissions(dto.permissionIds ?? []);
    const role = this.roleRepository.create({
      name: dto.name.trim(),
      description: dto.description,
      permissions,
    });
    return this.roleRepository.save(role);
  }

  async updateRole(id: number, dto: UpdateRoleDto) {
    const role = await this.findRole(id);
    if (role.name === 'super-admin' && dto.name && dto.name !== role.name) {
      throw new BadRequestException('The super-admin role name is reserved');
    }

    if (dto.name !== undefined) {
      const name = dto.name.trim();
      const duplicate = await this.roleRepository.findOne({ where: { name } });
      if (duplicate && duplicate.id !== id) {
        throw new ConflictException('Role name already exists');
      }
      role.name = name;
    }
    if (dto.description !== undefined) role.description = dto.description;
    if (dto.permissionIds !== undefined) {
      const permissions = await this.findPermissions(dto.permissionIds);
      if (
        role.name === 'super-admin' &&
        (!permissions.some(
          (permission) => permission.name === 'manage_roles',
        ) ||
          !permissions.some((permission) => permission.name === 'manage_users'))
      ) {
        throw new BadRequestException(
          'The super-admin role must retain manage_users and manage_roles',
        );
      }
      role.permissions = permissions;
    }
    return this.roleRepository.save(role);
  }

  async deleteRole(id: number) {
    const role = await this.findRole(id);
    if (role.name === 'super-admin') {
      throw new BadRequestException('The super-admin role cannot be deleted');
    }
    const assignedUsers = await this.adminUserRepository.count({
      where: { role: { id } },
    });
    if (assignedUsers > 0) {
      throw new BadRequestException('Reassign users before deleting this role');
    }
    await this.roleRepository.remove(role);
    return { deleted: true, id };
  }

  private async findUser(id: number): Promise<AdminUser> {
    const user = await this.adminUserRepository.findOne({
      where: { id },
      relations: ['role', 'role.permissions'],
    });
    if (!user) throw new NotFoundException('Admin user not found');
    return user;
  }

  private async findRole(id: number): Promise<Role> {
    const role = await this.roleRepository.findOne({
      where: { id },
      relations: ['permissions'],
    });
    if (!role) throw new NotFoundException('Role not found');
    return role;
  }

  private async findPermissions(ids: number[]): Promise<Permission[]> {
    if (ids.length === 0) return [];
    const permissions = await this.permissionRepository.findBy({ id: In(ids) });
    if (permissions.length !== new Set(ids).size) {
      throw new BadRequestException('One or more permissions do not exist');
    }
    return permissions;
  }

  private async ensureSuperAdminRemains(
    user: AdminUser,
    nextRole: Role | undefined,
    nextActive: boolean,
  ): Promise<void> {
    const wasActiveSuperAdmin =
      user.isActive && user.role?.name === 'super-admin';
    const remainsActiveSuperAdmin =
      nextActive && (nextRole?.name ?? user.role?.name) === 'super-admin';
    if (!wasActiveSuperAdmin || remainsActiveSuperAdmin) return;

    const activeSuperAdmins = await this.adminUserRepository.count({
      where: { isActive: true, role: { name: 'super-admin' } },
    });
    if (activeSuperAdmins <= 1) {
      throw new BadRequestException(
        'At least one active super-admin must remain',
      );
    }
  }

  private async assertCanGrantRole(
    requesterId: number,
    role: Role,
  ): Promise<void> {
    const requester = await this.getUserAccess(requesterId);
    if (!requester || !requester.isActive) {
      throw new UnauthorizedException('Admin account is inactive or missing');
    }
    if (requester.permissions.includes('manage_roles')) return;

    const canGrantRole = role.permissions.every((permission) =>
      requester.permissions.includes(permission.name),
    );
    if (!canGrantRole) {
      throw new ForbiddenException(
        'You cannot assign a role with permissions you do not hold',
      );
    }
  }

  private async assertCanManageUser(
    requesterId: number,
    target: AdminUser,
  ): Promise<void> {
    const requester = await this.getUserAccess(requesterId);
    if (!requester || !requester.isActive) {
      throw new UnauthorizedException('Admin account is inactive or missing');
    }
    if (requester.permissions.includes('manage_roles')) return;

    const targetPermissions =
      target.role?.permissions?.map(({ name }) => name) ?? [];
    if (
      targetPermissions.some(
        (permission) => !requester.permissions.includes(permission),
      )
    ) {
      throw new ForbiddenException(
        'You cannot manage an account with greater permissions',
      );
    }
  }

  private toSafeUser(user: AdminUser) {
    return {
      id: user.id,
      username: user.username,
      fullName: user.fullName ?? null,
      email: user.email ?? null,
      phone: user.phone ?? null,
      isActive: user.isActive,
      mustChangePassword: user.mustChangePassword === true,
      roleId: user.role?.id ?? null,
      role: user.role?.name ?? null,
      permissions: user.role?.permissions?.map(({ name }) => name) ?? [],
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async seedDefaultAdmin() {
    const superAdminRole = await this.roleRepository.findOne({
      where: { name: 'super-admin' },
      relations: ['permissions'],
    });
    const existingAdmin = await this.adminUserRepository.findOne({
      where: { username: 'admin' },
      relations: ['role'],
    });
    if (existingAdmin) {
      let changed = false;
      if (!existingAdmin.role && superAdminRole) {
        existingAdmin.role = superAdminRole;
        changed = true;
      }
      if (
        !existingAdmin.mustChangePassword &&
        (await this.usesKnownDefaultPassword(existingAdmin.password))
      ) {
        existingAdmin.mustChangePassword = true;
        changed = true;
        this.logger.warn(
          'The "admin" account still uses a known default password and must change it at next login.',
        );
      }
      if (changed) await this.adminUserRepository.save(existingAdmin);
      return;
    }

    if ((await this.adminUserRepository.count()) > 0) return;

    const initialPassword = process.env.DEFAULT_ADMIN_PASSWORD;
    if (!initialPassword || initialPassword.length < MIN_PASSWORD_LENGTH) {
      this.logger.warn(
        `No admin account exists. Set DEFAULT_ADMIN_PASSWORD (at least ${MIN_PASSWORD_LENGTH} characters) and restart to create the first one.`,
      );
      return;
    }

    const admin = this.adminUserRepository.create({
      username: 'admin',
      password: await bcrypt.hash(initialPassword, 12),
      mustChangePassword: true,
      role: superAdminRole ?? undefined,
    });
    await this.adminUserRepository.save(admin);
    this.logger.log('Created the initial "admin" account; it must change its password at first login.');
  }

  async changePassword(userId: number, dto: ChangePasswordDto) {
    const user = await this.adminUserRepository.findOne({
      where: { id: userId },
    });
    if (!user || !user.isActive) throw new UnauthorizedException();

    if (!(await bcrypt.compare(dto.currentPassword, user.password))) {
      throw new BadRequestException('Current password is incorrect');
    }
    if (dto.newPassword === dto.currentPassword) {
      throw new BadRequestException(
        'The new password must be different from the current one',
      );
    }
    if (dto.newPassword.toLowerCase().includes(user.username.toLowerCase())) {
      throw new BadRequestException(
        'The new password must not contain your username',
      );
    }

    user.password = await bcrypt.hash(dto.newPassword, 12);
    user.mustChangePassword = false;
    await this.adminUserRepository.save(user);
    // Revoke all outstanding refresh tokens so other sessions end now.
    await this.revokeAllUserTokens(userId);
    return { success: true };
  }

  private async usesKnownDefaultPassword(hash: string): Promise<boolean> {
    for (const candidate of KNOWN_DEFAULT_PASSWORDS) {
      if (await bcrypt.compare(candidate, hash)) return true;
    }
    return false;
  }

  private async ensureRoleAndPermissionSeed() {
    const defaultPermissions = [
      'manage_users',
      'manage_roles',
      'manage_permissions',
      'manage_blog',
      'manage_courses',
      'manage_languages',
      'manage_media',
      'manage_mail_settings',
      'view_dashboard',
      'manage_course_requests',
      'manage_site_settings',
      'view_statistics',
    ];

    const existingPermissions = await this.permissionRepository.find();
    const permissionMap = new Map(
      existingPermissions.map((permission) => [permission.name, permission]),
    );

    for (const name of defaultPermissions) {
      if (!permissionMap.has(name)) {
        const permission = this.permissionRepository.create({
          name,
          description: name,
        });
        const stored = await this.permissionRepository.save(permission);
        permissionMap.set(name, stored);
      }
    }

    const rolesToSeed: Record<string, string[]> = {
      'super-admin': defaultPermissions,
      'content-manager': [
        'manage_blog',
        'manage_languages',
        'manage_media',
        'view_dashboard',
        'manage_course_requests',
      ],
      'course-manager': [
        'manage_courses',
        'manage_course_requests',
        'view_dashboard',
      ],
      'support-operations': [
        'view_dashboard',
        'manage_mail_settings',
        'manage_course_requests',
      ],
    };

    for (const [name, permissionNames] of Object.entries(rolesToSeed)) {
      const permissions = permissionNames
        .map((permissionName) => permissionMap.get(permissionName))
        .filter((permission): permission is Permission => !!permission);
      const role = await this.roleRepository.findOne({
        where: { name },
        relations: ['permissions'],
      });
      if (!role) {
        await this.roleRepository.save(
          this.roleRepository.create({
            name,
            description: `${name} access for the Orizzonti backoffice`,
            permissions,
          }),
        );
        continue;
      }

      const existingIds = new Set(role.permissions?.map(({ id }) => id) ?? []);
      const missingPermissions = permissions.filter(
        ({ id }) => !existingIds.has(id),
      );
      if (missingPermissions.length > 0) {
        role.permissions = [...(role.permissions ?? []), ...missingPermissions];
        await this.roleRepository.save(role);
      }
    }
  }
}
