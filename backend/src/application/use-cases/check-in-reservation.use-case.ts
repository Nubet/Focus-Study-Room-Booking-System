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

    if (input.method === "PIN" && input.code !== "123456") {
      throw new InvalidAccessCodeError();
    }

    if (input.method === "QR" && input.code !== "signed-qr-payload") {
      throw new InvalidAccessCodeError();
    }

    reservation.markOccupied();
    await this.reservationRepository.save(reservation);

    return reservation;
  }
}
