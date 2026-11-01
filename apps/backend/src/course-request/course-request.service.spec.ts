import { CourseRequestService } from './course-request.service';

describe('CourseRequestService', () => {
  it('creates a course request and enqueues a confirmation email', async () => {
    const courseRequest = {
      id: 1,
      fullName: 'Alice Smith',
      email: 'alice@example.com',
      phone: '+216 12 345 678',
      courseName: 'English for Beginners',
      message: 'Interested in the next available group.',
      status: 'new',
      createdAt: new Date('2026-01-01T00:00:00Z'),
    };

    const manager = {
      create: jest.fn().mockImplementation((_e, value) => value),
      save: jest.fn().mockResolvedValue(courseRequest),
    };
    const dataSource = {
      transaction: jest.fn((cb: (m: unknown) => unknown) => cb(manager)),
    } as any;
    const notifications = {
      enqueue: jest.fn().mockResolvedValue(undefined),
    } as any;
    const repository = {
      find: jest.fn().mockResolvedValue([courseRequest]),
      findOne: jest.fn().mockResolvedValue(courseRequest),
      remove: jest.fn().mockResolvedValue(undefined),
    } as any;

    const service = new CourseRequestService(
      repository,
      dataSource,
      notifications,
    );

    const result = await service.create({
      fullName: 'Alice Smith',
      email: 'alice@example.com',
      phone: '+216 12 345 678',
      courseName: 'English for Beginners',
      message: 'Interested in the next available group.',
    });

    expect(manager.save).toHaveBeenCalled();
    expect(notifications.enqueue).toHaveBeenCalledTimes(1);
    expect(notifications.enqueue).toHaveBeenCalledWith(
      manager,
      expect.objectContaining({ recipient: 'alice@example.com' }),
    );
    expect(result.status).toBe('new');
    expect(result.courseName).toBe('English for Beginners');
  });
});
