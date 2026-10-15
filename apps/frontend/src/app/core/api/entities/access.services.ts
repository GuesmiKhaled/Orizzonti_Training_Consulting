import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import {
  AdminPermission,
  AdminRole,
  AdminUserPage,
  AuthUser,
  MailSettings,
} from '../../../services/orizzonti-api.service';
import { API_BASE_URL } from '../api.config';
import { CrudService } from '../crud.service';

export interface CreateUserDto {
  username: string;
  password: string;
  roleId: number;
  isActive?: boolean;
  fullName?: string | null;
  email?: string | null;
  phone?: string | null;
}

export type UpdateUserDto = Partial<CreateUserDto>;

export interface CreateRoleDto {
  name: string;
  description?: string;
  permissionIds: number[];
}

export type UpdateRoleDto = Partial<CreateRoleDto>;

@Injectable({ providedIn: 'root' })
export class UsersService extends CrudService<
  AuthUser,
  CreateUserDto,
  UpdateUserDto
> {
  protected path(): string {
    return 'auth/users';
  }

  listPage(
    page = 0,
    size = 20,
    search = '',
    roleId: number | null = null,
  ): Observable<AdminUserPage> {
    return this.http.get<AdminUserPage>(this.collectionUrl([]), {
      params: { page, size, search, ...(roleId ? { roleId } : {}) },
    });
  }

  override list(): Observable<AuthUser[]> {
    return this.listPage().pipe(map((result) => result.items));
  }
}

@Injectable({ providedIn: 'root' })
export class RolesService extends CrudService<
  AdminRole,
  CreateRoleDto,
  UpdateRoleDto
> {
  protected path(): string {
    return 'auth/roles';
  }
}

/** Read-only: the API only lists permissions. */
@Injectable({ providedIn: 'root' })
export class PermissionsService extends CrudService<AdminPermission, never, never> {
  protected path(): string {
    return 'auth/permissions';
  }
}

/** Singleton resource (GET/PATCH /settings/mail), so not a CrudService. */
@Injectable({ providedIn: 'root' })
export class MailSettingsService {
  private readonly http = inject(HttpClient);
  private readonly url = `${inject(API_BASE_URL)}/settings/mail`;

  get(): Observable<MailSettings> {
    return this.http.get<MailSettings>(this.url);
  }

  save(settings: Partial<MailSettings>): Observable<MailSettings> {
    return this.http.patch<MailSettings>(this.url, settings);
  }
}
