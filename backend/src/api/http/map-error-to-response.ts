import {
  InvalidAccessCodeError,
  InvalidPayloadError,
  InvalidQueryError,
  InvalidReservationTimeError,
  ReservationNotFoundError,
  ReservationStateConflictError,
  SlotAlreadyReservedError
} from "../../domain/errors/reservation-errors.js";

type HttpErrorResponse = {
  statusCode: number;
  message: string;
};

export const mapErrorToResponse = (error: unknown): HttpErrorResponse => {
  if (error instanceof SlotAlreadyReservedError) {
    return { statusCode: 409, message: error.message };
  }

  if (error instanceof ReservationNotFoundError) {
    return { statusCode: 404, message: error.message };
  }

  if (error instanceof InvalidAccessCodeError) {
    return { statusCode: 403, message: error.message };
  }

  if (error instanceof ReservationStateConflictError) {
    return { statusCode: 409, message: error.message };
  }

  if (
    error instanceof InvalidPayloadError ||
    error instanceof InvalidQueryError ||
    error instanceof InvalidReservationTimeError
  ) {
    return { statusCode: 400, message: error.message };
  }

  return { statusCode: 500, message: "Unexpected error" };
};
