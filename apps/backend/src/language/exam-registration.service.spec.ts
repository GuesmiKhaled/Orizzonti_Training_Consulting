/// <reference types="jest" />
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { ExamRegistrationService } from './exam-registration.service';

describe('ExamRegistrationService', () => {
  const future = (days: number) => new Date(Date.now() + days * 86400000);
  const dto = { fullName: 'Jane Doe', email: ' Jane@Example.com ' };

  function setup(opts: {
    session?: Record<string, unknown> | null;
    levelExists?: boolean;
    held?: number;
    duplicate?: boolean;
  }) {
    const session =
      opts.session === undefined
        ? {
            id: 1,
            languageLevelId: 2,
            isActive: true,
            examDate: future(10),
            registrationStartDate: future(-1),
            registrationDeadline: future(5),
            maxParticipants: 2,
          }
        : opts.session;
    const manager = {
      exists: jest
        .fn()
        .mockImplementation((entity: { name: string }) =>
          Promise.resolve(
            entity.name === 'LanguageLevel'
              ? (opts.levelExists ?? true)
              : (opts.duplicate ?? false),
          ),
        ),
      findOne: jest.fn().mockResolvedValue(session),
      count: jest.fn().mockResolvedValue(opts.held ?? 0),
      create: jest.fn().mockImplementation((_e, value) => value),
      save: jest
        .fn()
        .mockImplementation((value) => Promise.resolve({ id: 9, ...value })),
    };
    const dataSource = {
      transaction: jest.fn((cb: (m: unknown) => unknown) => cb(manager)),
    };
    const mailer = { sendMail: jest.fn().mockResolvedValue(undefined) };
    const service = new ExamRegistrationService(
      {} as never,
      dataSource as never,
      mailer as never,
    );
    return { service, manager, mailer };
  }

  it('creates a pending registration and sends a confirmation', async () => {
    const { service, manager, mailer } = setup({ held: 1 });
    const result = await service.register(1, 2, 1, dto);
    expect(result).toMatchObject({ id: 9, status: 'pending' });
    expect(manager.save).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'jane@example.com', status: 'pending' }),
    );
    expect(mailer.sendMail).toHaveBeenCalledTimes(1);
  });

  it('rejects when fully booked', async () => {
    const { service } = setup({ held: 2 });
    await expect(service.register(1, 2, 1, dto)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('rejects duplicate email for the same exam', async () => {
    const { service } = setup({ duplicate: true });
    await expect(service.register(1, 2, 1, dto)).rejects.toThrow(
      ConflictException,
    );
  });

  it('rejects unknown session', async () => {
    const { service } = setup({ session: null });
    await expect(service.register(1, 2, 1, dto)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('does not fail the registration if email sending fails', async () => {
    const { service, mailer } = setup({});
    mailer.sendMail.mockRejectedValue(new Error('smtp down'));
    await expect(service.register(1, 2, 1, dto)).resolves.toMatchObject({
      status: 'pending',
    });
  });

  it('blocks re-accepting a rejected registration when no places remain', async () => {
    const { service, manager } = setup({ held: 2 });
    manager.findOne
      .mockResolvedValueOnce({ id: 5, examSessionId: 1, status: 'rejected' })
      .mockResolvedValueOnce({ id: 1, maxParticipants: 2 });
    await expect(service.updateStatus(5, 'accepted')).rejects.toThrow(
      ConflictException,
    );
  });

  it('accepts a pending registration and emails the applicant', async () => {
    const { service, manager, mailer } = setup({ held: 2 });
    manager.findOne
      .mockResolvedValueOnce({
        id: 5,
        examSessionId: 1,
        status: 'pending',
        email: 'a@b.c',
        fullName: 'A',
      })
      .mockResolvedValueOnce({ id: 1, maxParticipants: 2, examDate: future(3) });
    const result = await service.updateStatus(5, 'accepted');
    expect(result.status).toBe('accepted');
    expect(mailer.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'a@b.c' }),
    );
  });
});
