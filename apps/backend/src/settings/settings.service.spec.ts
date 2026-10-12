import { Repository } from 'typeorm';
import { MailSettings } from './mail-settings.entity';
import { SettingsService } from './settings.service';

describe('SettingsService', () => {
  let service: SettingsService;
  let repository: jest.Mocked<
    Pick<Repository<MailSettings>, 'find' | 'create' | 'save' | 'merge'>
  >;

  beforeEach(() => {
    repository = {
      find: jest.fn(),
      create: jest.fn((values) => values as MailSettings),
      save: jest.fn(),
      merge: jest.fn((entity, values) => ({ ...entity, ...values })),
    };
    service = new SettingsService(
      repository as unknown as Repository<MailSettings>,
    );
  });

  it('returns the latest existing mail settings', async () => {
    const latest = { id: 3, host: 'smtp.example.com' } as MailSettings;
    repository.find.mockResolvedValue([latest]);

    await expect(service.getMailSettings()).resolves.toBe(latest);
    expect(repository.find).toHaveBeenCalledWith({
      order: { id: 'DESC' },
      take: 1,
    });
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('creates default mail settings when none exist', async () => {
    const created = { id: 1, host: 'smtp.example.com' } as MailSettings;
    repository.find.mockResolvedValue([]);
    repository.save.mockResolvedValue(created);

    await expect(service.getMailSettings()).resolves.toBe(created);
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        host: expect.any(String),
        port: expect.any(Number),
        secure: true,
      }),
    );
    expect(repository.save).toHaveBeenCalledTimes(1);
  });

  it('updates the latest mail settings', async () => {
    const current = { id: 2, host: 'old.example.com' } as MailSettings;
    const updated = { ...current, host: 'smtp.example.com' };
    repository.find.mockResolvedValue([current]);
    repository.save.mockResolvedValue(updated);

    await expect(
      service.updateMailSettings({ host: 'smtp.example.com' }),
    ).resolves.toBe(updated);
    expect(repository.merge).toHaveBeenCalledWith(current, {
      host: 'smtp.example.com',
    });
    expect(repository.save).toHaveBeenCalledWith(updated);
  });
});
