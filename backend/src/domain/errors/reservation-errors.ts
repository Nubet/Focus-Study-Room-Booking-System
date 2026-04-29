export class SlotAlreadyReservedError extends Error {
  constructor() {
    super("Slot already reserved");
  }
}

export class ReservationNotFoundError extends Error {
  constructor() {
    super("Reservation not found");
  }
}

export class InvalidReservationTimeError extends Error {
  constructor() {
    super("startTime must be before endTime");
  }
}

export class InvalidPayloadError extends Error {
  constructor() {
    super("Invalid payload");
  }
}

export class InvalidQueryError extends Error {
  constructor() {
    super("Invalid query");
  }
}

export class InvalidAccessCodeError extends Error {
  constructor() {
    super("Invalid access code");
  }
}

export class ReservationStateConflictError extends Error {
  constructor() {
    super("Reservation state conflict");
  }
}
