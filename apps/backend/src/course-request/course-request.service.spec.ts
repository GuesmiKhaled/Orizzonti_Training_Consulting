import { CourseRequestService } from './course-request.service';

describe('CourseRequestService', () => {
  it('creates a course request with the expected payload', async () => {
    const courseRequest = {
      id: 1,
      fullName: 'Alice Smith',
      email: 'alice@example.com',
      phone: '+216 12 345 678',
      courseName: 'English for Beginners',
      message: 'Interested in the next available group.',
      status: 'new',
    };

    const repository = {
      create: jest.fn().mockReturnValue(courseRequest),
      save: jest.fn().mockResolvedValue(courseRequest),
      find: jest.fn().mockResolvedValue([courseRequest]),
      findOne: jest.fn().mockResolvedValue(courseRequest),
      remove: jest.fn().mockResolvedValue(undefined),
    } as any;

    const service = new CourseRequestService(repository);

    const result = await service.create({
      fullName: 'Alice Smith',
      email: 'alice@example.com',
      phone: '+216 12 345 678',
      courseName: 'English for Beginners',
      message: 'Interested in the next available group.',
    });

    expect(repository.create).toHaveBeenCalled();
    expect(result.status).toBe('new');
    expect(result.courseName).toBe('English for Beginners');
  });
});
