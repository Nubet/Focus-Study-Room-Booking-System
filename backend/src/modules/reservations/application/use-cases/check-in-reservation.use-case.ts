import { Reservation } from "../../domain/entities/reservation.js";
import {
  InvalidAccessCodeError,
  ReservationNotFoundError,
  ReservationStateConflictError
} from "../../domain/errors/reservation-errors.js";

type CheckInMethod = "PIN" | "QR";

type CheckInReservationInput = {
  reservationId: string;
  userId: string;
  method: CheckInMethod;
  code: string;
};

type ReservationRepository = {
  findById: (id: string) => Promise<Reservation | null>;
  save: (reservation: Reservation) => Promise<void>;
  consumeCheckInCode: (input: {
    reservationId: string;
    userId: string;
    method: CheckInMethod;
    code: string;
    now: Date;
  }) => Promise<boolean>;
};

export class CheckInReservationUseCase {
  constructor(private readonly reservationRepository: ReservationRepository) {}

  async execute(input: CheckInReservationInput): Promise<Reservation> {
    const reservation = await this.reservationRepository.findById(input.reservationId);

    if (!reservation) {
      throw new ReservationNotFoundError();
    }

    if (reservation.status !== "RESERVED") {
      throw new ReservationStateConflictError();
    }

    if (reservation.userId !== input.userId) {
      throw new InvalidAccessCodeError();
    }

    const now = new Date();
    const windowStart = reservation.startTime;
    const windowEnd = new Date(reservation.startTime.getTime() + 10 * 60 * 1000);

    if (now < windowStart || now > windowEnd) {
      throw new InvalidAccessCodeError();
    }

    const isValidCode = await this.reservationRepository.consumeCheckInCode({
      reservationId: reservation.id,
      userId: input.userId,
      method: input.method,
      code: input.code,
      now
    });

    if (!isValidCode) {
      throw new InvalidAccessCodeError();
    }

    reservation.markOccupied(now);
    await this.reservationRepository.save(reservation);

    return reservation;
  }
}
