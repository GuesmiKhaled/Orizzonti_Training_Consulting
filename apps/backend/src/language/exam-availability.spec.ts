import { describe, expect, it } from '@jest/globals';
import { computeAvailability } from './exam-availability';

describe('computeAvailability', () => {
  const now = new Date('2026-10-15T12:00:00Z');
  const base = {
    isActive: true,
    registrationStartDate: new Date('2026-10-12T00:00:00Z'),
    registrationDeadline: new Date('2026-10-20T00:00:00Z'),
    maxParticipants: 5,
  };

  it('is open with places left', () => {
    expect(computeAvailability(base, 2, now)).toEqual({
      placesLeft: 3,
      isBookable: true,
      bookingStatus: 'Open',
    });
  });

  it('is open without limit', () => {
    const result = computeAvailability(
      { ...base, maxParticipants: null },
      100,
      now,
    );
    expect(result.placesLeft).toBeNull();
    expect(result.isBookable).toBe(true);
  });

  it('is fully booked when places run out', () => {
    const result = computeAvailability(base, 5, now);
    expect(result).toMatchObject({
      placesLeft: 0,
      isBookable: false,
      bookingStatus: 'Fully booked',
    });
  });

  it('is closed after the deadline and before the start', () => {
    expect(
      computeAvailability(base, 0, new Date('2026-10-21T00:00:00Z')),
    ).toMatchObject({
      isBookable: false,
      bookingStatus: 'Registration closed',
    });
    expect(
      computeAvailability(base, 0, new Date('2026-10-01T00:00:00Z')),
    ).toMatchObject({
      isBookable: false,
      bookingStatus: 'Registration not open yet',
    });
  });

  it('is unavailable when inactive', () => {
    expect(
      computeAvailability({ ...base, isActive: false }, 0, now).isBookable,
    ).toBe(false);
  });
});
