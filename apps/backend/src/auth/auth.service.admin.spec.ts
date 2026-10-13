import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';

const superAdmin = {
  id: 1,
  name: 'super-admin',
  permissions: [
    { id: 1, name: 'manage_users' },
    { id: 2, name: 'manage_roles' },
  ],
};

describe('AuthService admin management', () => {
  let service: AuthService;
  let users: any;
  let roles: any;
  let permissions: any;

  beforeEach(() => {
    users = {
      findOne: jest.fn(),
      findAndCount: jest.fn(),
      create: jest.fn((entity) => ({ id: 5, ...entity })),
      save: jest.fn(async (entity) => entity),
      remove: jest.fn(),
      count: jest.fn(),
    };
    roles = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn((entity) => entity),
      save: jest.fn(async (entity) => entity),
      remove: jest.fn(),
    };
    permissions = {
      find: jest.fn(),
      findBy: jest.fn(),
    };
    service = new AuthService(users, roles, permissions);
  });

  it('creates an admin with a bcrypt password hash and never returns it', async () => {
    users.findOne.mockResolvedValue(null);
    users.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce({
      id: 1,
      isActive: true,
      role: superAdmin,
    });
    roles.findOne.mockResolvedValue(superAdmin);

    const result = await service.createUser(
      {
        username: 'editor',
        password: 'TestingPassword123!',
        roleId: 1,
      },
      1,
    );

    expect(
      await bcrypt.compare(
        'TestingPassword123!',
        users.save.mock.calls[0][0].password,
      ),
    ).toBe(true);
    expect(result).not.toHaveProperty('password');
    expect(result.username).toBe('editor');
  });

  it('returns sanitized users in a paginated result', async () => {
    users.findAndCount.mockResolvedValue([
      [
        {
          id: 2,
          username: 'editor',
          password: 'hash',
          isActive: true,
          role: superAdmin,
        },
      ],
      1,
    ]);

    const result = await service.listUsers({
      page: 1,
      size: 10,
      search: 'edit',
    });

    expect(users.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 10, take: 10 }),
    );
    expect(result).toMatchObject({ total: 1, page: 1, size: 10 });
    expect(result.items[0]).not.toHaveProperty('password');
  });

  it('rejects deactivating the current admin account', async () => {
    users.findOne.mockResolvedValue({
      id: 7,
      username: 'admin',
      isActive: true,
      role: superAdmin,
    });

    await expect(service.updateUser(7, { isActive: false }, 7)).rejects.toThrow(
      'You cannot deactivate your own account',
    );
    expect(users.save).not.toHaveBeenCalled();
  });

  it('prevents deleting the last active super-admin', async () => {
    users.findOne.mockResolvedValue({
      id: 1,
      username: 'admin',
      isActive: true,
      role: superAdmin,
    });
    users.count.mockResolvedValue(1);

    await expect(service.deleteUser(1, 2)).rejects.toThrow(
      'At least one active super-admin must remain',
    );
    expect(users.remove).not.toHaveBeenCalled();
  });

  it('prevents a user manager from granting permissions they do not hold', async () => {
    users.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce({
      id: 2,
      isActive: true,
      role: { name: 'user-manager', permissions: [{ name: 'manage_users' }] },
    });
    roles.findOne.mockResolvedValue(superAdmin);

    await expect(
      service.createUser(
        {
          username: 'new-admin',
          password: 'TestingPassword123!',
          roleId: 1,
        },
        2,
      ),
    ).rejects.toThrow(
      'You cannot assign a role with permissions you do not hold',
    );
    expect(users.save).not.toHaveBeenCalled();
  });

  it('prevents a user manager from deleting a higher-privilege account', async () => {
    users.findOne
      .mockResolvedValueOnce({
        id: 1,
        username: 'superadmin',
        isActive: true,
        role: superAdmin,
      })
      .mockResolvedValueOnce({
        id: 2,
        isActive: true,
        role: { name: 'user-manager', permissions: [{ name: 'manage_users' }] },
      });

    await expect(service.deleteUser(1, 2)).rejects.toThrow(
      'You cannot manage an account with greater permissions',
    );
    expect(users.remove).not.toHaveBeenCalled();
  });

  it('does not allow weakening super-admin recovery permissions', async () => {
    roles.findOne.mockResolvedValue(superAdmin);
    permissions.findBy.mockResolvedValue([{ id: 2, name: 'manage_roles' }]);

    await expect(service.updateRole(1, { permissionIds: [2] })).rejects.toThrow(
      'The super-admin role must retain manage_users and manage_roles',
    );
    expect(roles.save).not.toHaveBeenCalled();
  });

  it('assigns the super-admin role to an existing role-less default account', async () => {
    const existingAdmin = {
      id: 1,
      username: 'admin',
      password: 'existing-hash',
      role: null,
    };
    users.findOne.mockResolvedValue(existingAdmin);
    roles.findOne.mockResolvedValue(superAdmin);

    await service.seedDefaultAdmin();

    expect(existingAdmin.role).toBe(superAdmin);
    expect(existingAdmin.password).toBe('existing-hash');
    expect(users.save).toHaveBeenCalledWith(existingAdmin);
    expect(users.count).not.toHaveBeenCalled();
  });
});
