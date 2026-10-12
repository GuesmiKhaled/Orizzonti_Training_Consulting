import {
  Injectable,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { AdminUser } from './admin-user.entity';
import { Permission } from './permission.entity';
import { Role } from './role.entity';

@Injectable()
export class AuthService implements OnModuleInit {
  constructor(
    @InjectRepository(AdminUser)
    private readonly adminUserRepository: Repository<AdminUser>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
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

    const permissionNames =
      user.role?.permissions?.map((permission) => permission.name) ?? [];
    const jwtSecret =
      process.env.JWT_SECRET ??
      's/+sWIP+aRiNXJYPtpvbsOXHnbl7XMTNy3oXaMXQQyL+J4tjgi65Id0eDVbBwLBwfWJQ0LKYoDmkKWg/Klp1Rw==';

    return {
      user: {
        id: user.id,
        username: user.username,
        role: user.role?.name ?? 'super-admin',
        permissions: permissionNames,
      },
      accessToken: jwt.sign(
        {
          sub: user.id,
          username: user.username,
          role: user.role?.name ?? 'super-admin',
        },
        jwtSecret,
        {
          expiresIn: '8h',
        },
      ),
    };
  }

  async getRoles() {
    return this.roleRepository.find({ relations: ['permissions'] });
  }

  async getProfile() {
    const admin = await this.adminUserRepository.findOne({
      where: { username: 'admin' },
      relations: ['role', 'role.permissions'],
    });

    if (!admin) {
      return null;
    }

    return {
      id: admin.id,
      username: admin.username,
      role: admin.role?.name ?? 'super-admin',
      permissions:
        admin.role?.permissions?.map((permission) => permission.name) ?? [],
    };
  }

  async seedDefaultAdmin() {
    const created = await this.adminUserRepository.count();
    if (created > 0) {
      return;
    }

    const superAdminRole = await this.roleRepository.findOne({
      where: { name: 'super-admin' },
      relations: ['permissions'],
    });

    const passwordHash = await bcrypt.hash('admin123', 10);
    const admin = this.adminUserRepository.create({
      username: 'admin',
      password: passwordHash,
      role: superAdminRole ?? undefined,
    });

    await this.adminUserRepository.save(admin);
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

    const allPermissions = [...permissionMap.values()];
    const superRole = await this.roleRepository.findOne({
      where: { name: 'super-admin' },
      relations: ['permissions'],
    });

    if (!superRole) {
      const newRole = this.roleRepository.create({
        name: 'super-admin',
        description: 'Full access to the Orizzonti backoffice',
        permissions: allPermissions,
      });
      await this.roleRepository.save(newRole);
      return;
    }

    const nextPermissions = allPermissions.filter(
      (permission) =>
        !superRole.permissions?.some((current) => current.id === permission.id),
    );

    if (nextPermissions.length > 0) {
      superRole.permissions = [
        ...(superRole.permissions ?? []),
        ...nextPermissions,
      ];
      await this.roleRepository.save(superRole);
    }
  }
}
