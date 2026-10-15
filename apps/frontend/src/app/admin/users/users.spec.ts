import { HttpTestingController } from '@angular/common/http/testing';
import { fakeAsync, tick } from '@angular/core/testing';
import { AdminPermission, AdminRole, AuthUser } from '../../services/orizzonti-api.service';
import {
  BASE,
  choose,
  clickButton,
  configureHttpTesting,
  expectCall,
  mount,
  rootOf,
  typeInto,
} from '../testing/admin-test-utils';
import { groupPermissions } from './roles/permission-groups';
import { RolesPageComponent } from './roles/roles-page.component';
import { displayName, maskPhone } from './user-format';
import { UserFormModalComponent } from './user-form-modal.component';
import { UsersPageComponent } from './users-page.component';

const PERMISSIONS: AdminPermission[] = [
  { id: 1, name: 'manage_blog' },
  { id: 2, name: 'manage_users' },
  { id: 3, name: 'view_dashboard' },
  { id: 99, name: 'custom_permission' },
];

const ROLES: AdminRole[] = [
  { id: 1, name: 'super-admin', description: 'Full access', permissions: PERMISSIONS.slice(0, 3) },
  { id: 2, name: 'editor', description: 'Writes content', permissions: [PERMISSIONS[0]] },
];

const USERS: AuthUser[] = [
  {
    id: 1,
    username: 'admin',
    fullName: 'Guesmi Khaled',
    email: 'info@orizzonti.tn',
    phone: '+216 24 422 753',
    role: 'super-admin',
    roleId: 1,
    isActive: true,
  },
  { id: 2, username: 'amel', fullName: null, email: null, phone: null, role: 'editor', roleId: 2, isActive: false },
];

describe('user formatting', () => {
  it('masks the middle of a phone number', () => {
    expect(maskPhone('+216 24 422 753')).toBe('+216 ••• ••• 753');
    expect(maskPhone('24 422 753')).toBe('••• ••• 753');
    expect(maskPhone('1234')).toBe('1234');
    expect(maskPhone(null)).toBe('—');
  });

  it('falls back to a dash when there is no full name', () => {
    expect(displayName({ username: 'a', fullName: ' Amel ' })).toBe('Amel');
    expect(displayName({ username: 'a', fullName: null })).toBe('—');
  });
});

describe('groupPermissions', () => {
  it('groups known permissions in display order and puts unknown ones in Other', () => {
    const groups = groupPermissions(PERMISSIONS);
    expect(groups.map((g) => g.title)).toEqual(['Content', 'Access', 'System', 'Other']);
    expect(groups[0].items.map((p) => p.name)).toEqual(['manage_blog']);
    expect(groups[3].items.map((p) => p.name)).toEqual(['custom_permission']);
  });

  it('omits empty groups', () => {
    expect(groupPermissions([PERMISSIONS[0]]).map((g) => g.title)).toEqual(['Content']);
  });
});

describe('UsersPageComponent', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    http = configureHttpTesting();
  });

  afterEach(() => http.verify());

  const usersUrl = '/auth/users';

  const open = () => {
    const fixture = mount(UsersPageComponent);
    expectCall(http, 'GET', '/auth/roles').flush(ROLES);
    tick(250);
    expectCall(http, 'GET', usersUrl).flush({ items: USERS, total: 2, page: 0, size: 10 });
    fixture.detectChanges();
    return fixture;
  };

  it('lists users with a masked phone, role and status', fakeAsync(() => {
    const root = rootOf(open());
    const rows = root.querySelectorAll('tbody tr');
    expect(rows.length).toBe(2);
    expect(rows[0].textContent).toContain('Guesmi Khaled');
    expect(rows[0].textContent).toContain('+216 ••• ••• 753');
    expect(rows[0].textContent).not.toContain('422');
    expect(rows[1].textContent).toContain('amel');
    expect(rows[1].querySelector('app-status-tag')?.textContent).toContain('Inactive');
  }));

  it('requests the first page with the page size', fakeAsync(() => {
    const fixture = mount(UsersPageComponent);
    expectCall(http, 'GET', '/auth/roles').flush(ROLES);
    tick(250);
    const req = expectCall(http, 'GET', usersUrl);
    expect(req.request.params.get('page')).toBe('0');
    expect(req.request.params.get('size')).toBe('10');
    req.flush({ items: [], total: 0, page: 0, size: 10 });
    fixture.detectChanges();
    expect(rootOf(fixture).querySelector('.state')?.textContent).toContain('No users found');
  }));

  it('searches on the server after a short debounce', fakeAsync(() => {
    const fixture = open();
    typeInto(rootOf(fixture), 'input.search', 'ame');
    tick(100);
    http.expectNone((r) => r.url === `${BASE}${usersUrl}`);
    tick(150);
    const req = expectCall(http, 'GET', usersUrl);
    expect(req.request.params.get('search')).toBe('ame');
    req.flush({ items: [USERS[1]], total: 1, page: 0, size: 10 });
  }));

  it('filters by role and returns to the first page', fakeAsync(() => {
    const fixture = open();
    choose(rootOf(fixture), 'select.toolbar-filter', 'editor');
    tick(250);
    const req = expectCall(http, 'GET', usersUrl);
    expect(req.request.params.get('roleId')).toBe('2');
    expect(req.request.params.get('page')).toBe('0');
    req.flush({ items: [USERS[1]], total: 1, page: 0, size: 10 });
  }));

  it('opens the add-user modal and closes it again', fakeAsync(() => {
    const fixture = open();
    clickButton(rootOf(fixture), 'button', 'Add user');
    fixture.detectChanges();
    expect(rootOf(fixture).querySelector('app-user-form-modal h2')?.textContent).toBe('Add user');
    clickButton(rootOf(fixture), 'app-user-form-modal footer button', 'Cancel');
    fixture.detectChanges();
    expect(rootOf(fixture).querySelector('app-user-form-modal')).toBeNull();
  }));

  it('deletes only after confirmation, then reloads', fakeAsync(() => {
    const fixture = open();
    const root = rootOf(fixture);
    clickButton(root, 'tbody tr:nth-child(2) .row-actions button', 'Delete');
    fixture.detectChanges();
    http.expectNone((r) => r.method === 'DELETE');

    clickButton(root, 'app-confirm-dialog footer button', 'Delete');
    const deletion = expectCall(http, 'DELETE', '/auth/users/2');
    expect(deletion.request.method).toBe('DELETE');
    deletion.flush({ deleted: true, id: 2 });
    tick(250);
    const refreshed = expectCall(http, 'GET', usersUrl);
    refreshed.flush({ items: [USERS[0]], total: 1, page: 0, size: 10 });
    fixture.detectChanges();
    expect(root.querySelectorAll('tbody tr').length).toBe(1);
  }));
});

describe('UserFormModalComponent', () => {
  let http: HttpTestingController;
  let saved: number;

  beforeEach(() => {
    http = configureHttpTesting();
    saved = 0;
  });

  afterEach(() => http.verify());

  const open = (user: AuthUser | null) => {
    const fixture = mount(UserFormModalComponent, { user, roles: ROLES });
    fixture.componentInstance.saved.subscribe(() => saved++);
    return fixture;
  };

  it('does not submit an invalid new user and shows why', () => {
    const fixture = open(null);
    clickButton(rootOf(fixture), 'footer button', 'Create user');
    fixture.detectChanges();
    http.expectNone((r) => r.method === 'POST');
    expect(rootOf(fixture).querySelectorAll('[role="alert"]').length).toBeGreaterThan(0);
  });

  it('creates a user, omitting blank contact fields', () => {
    const fixture = open(null);
    const root = rootOf(fixture);
    typeInto(root, 'input[formControlName="username"]', 'newuser');
    typeInto(root, 'input[formControlName="password"]', 'longenough');
    choose(root, 'select', 'editor');
    clickButton(root, 'footer button', 'Create user');

    const req = expectCall(http, 'POST', '/auth/users');
    expect(req.request.body).toEqual(
      jasmine.objectContaining({ username: 'newuser', password: 'longenough', roleId: 2, isActive: true }),
    );
    expect(req.request.body.fullName).toBeUndefined();
    expect(req.request.body.email).toBeUndefined();
    req.flush({ id: 9, username: 'newuser' });
    expect(saved).toBe(1);
  });

  it('rejects a short password and a bad email', () => {
    const fixture = open(null);
    const root = rootOf(fixture);
    typeInto(root, 'input[formControlName="username"]', 'newuser');
    typeInto(root, 'input[formControlName="password"]', 'short');
    typeInto(root, 'input[formControlName="email"]', 'nope');
    choose(root, 'select', 'editor');
    clickButton(root, 'footer button', 'Create user');
    fixture.detectChanges();
    http.expectNone((r) => r.method === 'POST');
    expect(root.textContent).toContain('At least 8 characters');
    expect(root.textContent).toContain('valid email');
  });

  it('prefills an existing user and sends cleared fields as null without a password', () => {
    const fixture = open(USERS[0]);
    const root = rootOf(fixture);
    expect(root.querySelector<HTMLInputElement>('input[formControlName="username"]')?.value).toBe('admin');
    expect(root.querySelector<HTMLInputElement>('input[formControlName="fullName"]')?.value).toBe('Guesmi Khaled');

    typeInto(root, 'input[formControlName="fullName"]', '');
    clickButton(root, 'footer button', 'Save user');

    const req = expectCall(http, 'PATCH', '/auth/users/1');
    expect(req.request.body.fullName).toBeNull();
    expect('password' in req.request.body).toBeFalse();
    expect(req.request.body.roleId).toBe(1);
    req.flush({});
    expect(saved).toBe(1);
  });
});

describe('RolesPageComponent', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    http = configureHttpTesting();
  });

  afterEach(() => http.verify());

  const open = () => {
    const fixture = mount(RolesPageComponent);
    expectCall(http, 'GET', '/auth/roles').flush(ROLES);
    expectCall(http, 'GET', '/auth/permissions').flush(PERMISSIONS);
    fixture.detectChanges();
    return fixture;
  };

  const reload = (fixture: ReturnType<typeof open>) => {
    expectCall(http, 'GET', '/auth/roles').flush(ROLES);
    expectCall(http, 'GET', '/auth/permissions').flush(PERMISSIONS);
    fixture.detectChanges();
  };

  it('selects the first role and shows grouped permissions', () => {
    const root = rootOf(open());
    expect(root.querySelector('.panel-header')?.textContent).toContain('Edit role: super-admin');
    const titles = Array.from(root.querySelectorAll('legend')).map((l) => l.textContent?.trim());
    expect(titles).toEqual(['Content', 'Access', 'System', 'Other']);
    expect(root.querySelector('.perm small')?.textContent).toBe('manage_blog');
  });

  it('locks the super-admin role: no save, no delete, fields disabled', () => {
    const root = rootOf(open());
    expect(root.querySelector('app-status-tag')?.textContent).toContain('Locked');
    expect(root.querySelector('form .actions')).toBeNull();
    expect(root.querySelector<HTMLFieldSetElement>('fieldset')?.disabled).toBeTrue();
    expect(root.querySelector<HTMLInputElement>('input[formControlName="name"]')?.disabled).toBeTrue();
  });

  it('shows the selected role permissions as checked and saves changes', () => {
    const fixture = open();
    const root = rootOf(fixture);
    clickButton(root, '.role-card', 'editor');
    fixture.detectChanges();

    const boxes = Array.from(root.querySelectorAll<HTMLInputElement>('.perm input'));
    expect(boxes.map((b) => b.checked)).toEqual([true, false, false, false]);

    boxes[1].checked = true;
    boxes[1].dispatchEvent(new Event('change'));
    clickButton(root, '.actions button', 'Save role');

    const req = expectCall(http, 'PATCH', '/auth/roles/2');
    expect(req.request.body).toEqual({
      name: 'editor',
      description: 'Writes content',
      permissionIds: [1, 2],
    });
    req.flush({ id: 2 });
    reload(fixture);
  });

  it('creates a new role', () => {
    const fixture = open();
    const root = rootOf(fixture);
    clickButton(root, 'button', 'New role');
    fixture.detectChanges();
    expect(root.querySelector('.panel-header')?.textContent).toContain('New role');

    typeInto(root, 'input[formControlName="name"]', 'support');
    const first = root.querySelector<HTMLInputElement>('.perm input');
    if (first) {
      first.checked = true;
      first.dispatchEvent(new Event('change'));
    }
    clickButton(root, '.actions button', 'Save role');
    const req = expectCall(http, 'POST', '/auth/roles');
    expect(req.request.body).toEqual({ name: 'support', description: '', permissionIds: [1] });
    req.flush({ id: 3 });
    reload(fixture);
  });

  it('requires a role name', () => {
    const fixture = open();
    const root = rootOf(fixture);
    clickButton(root, 'button', 'New role');
    fixture.detectChanges();
    clickButton(root, '.actions button', 'Save role');
    fixture.detectChanges();
    http.expectNone((r) => r.method === 'POST');
    expect(root.querySelector('[role="alert"]')?.textContent).toContain('Required');
  });

  it('deletes a role after confirmation', () => {
    const fixture = open();
    const root = rootOf(fixture);
    clickButton(root, '.role-list .link', 'Delete');
    fixture.detectChanges();
    http.expectNone((r) => r.method === 'DELETE');
    clickButton(root, 'app-confirm-dialog footer button', 'Delete');
    const deletion = expectCall(http, 'DELETE', '/auth/roles/2');
    expect(deletion.request.method).toBe('DELETE');
    deletion.flush({ deleted: true, id: 2 });
    reload(fixture);
  });
});
