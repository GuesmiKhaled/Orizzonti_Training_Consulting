/// <reference types="jest" />
import { LanguageController } from './language.controller';

describe('LanguageController availability', () => {
  const sessions = [{ id: 1 }, { id: 2 }, { id: 3 }];
  const language = {
    id: 1,
    levels: [
      { id: 10, examSessions: [sessions[0], sessions[1]] },
      { id: 11, examSessions: [sessions[2]] },
      { id: 12 },
    ],
  };
  const decorate = jest.fn().mockResolvedValue([]);
  const controller = new LanguageController(
    {
      findAll: jest.fn().mockResolvedValue([language]),
      findOne: jest.fn().mockResolvedValue(language),
    } as never,
    {} as never,
    {} as never,
    { decorate } as never,
    {} as never,
  );

  beforeEach(() => decorate.mockClear());

  it('decorates every nested exam in a single call when listing languages', async () => {
    const result = await controller.findAll();
    expect(result).toEqual([language]);
    expect(decorate).toHaveBeenCalledTimes(1);
    expect(decorate).toHaveBeenCalledWith(sessions);
  });

  it('decorates the exams of a single language', async () => {
    await controller.findOne(1);
    expect(decorate).toHaveBeenCalledWith(sessions);
  });
});
