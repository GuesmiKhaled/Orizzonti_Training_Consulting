export interface ExamAvailability {
  placesLeft: number | null;
  isBookable: boolean;
  bookingStatus: string;
}

export interface AvailabilityInput {
  isActive: boolean;
  registrationStartDate: Date;
  registrationDeadline: Date;
  maxParticipants?: number | null;
}

export function computeAvailability(
  session: AvailabilityInput,
  heldPlaces: number,
  now: Date = new Date(),
): ExamAvailability {
  const hasLimit = session.maxParticipants != null;
  const placesLeft = hasLimit
    ? Math.max(0, session.maxParticipants! - heldPlaces)
    : null;

  if (!session.isActive) {
    return { placesLeft, isBookable: false, bookingStatus: 'Not available' };
  }
  if (now < new Date(session.registrationStartDate)) {
    return {
      placesLeft,
      isBookable: false,
      bookingStatus: 'Registration not open yet',
    };
  }
  if (now > new Date(session.registrationDeadline)) {
    return {
      placesLeft,
      isBookable: false,
      bookingStatus: 'Registration closed',
    };
  }
  if (placesLeft === 0) {
    return { placesLeft, isBookable: false, bookingStatus: 'Fully booked' };
  }
  return { placesLeft, isBookable: true, bookingStatus: 'Open' };
}
