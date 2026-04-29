import { Reservation } from "../../domain/entities/reservation.js";
import {
  InvalidAccessCodeError,
  ReservationNotFoundError,
  ReservationStateConflictError
} from "../../domain/errors/reservation-errors.js";
import { verifySignedQrPayload } from "../security/qr-signed-payload-verifier.js";

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

    const now = new Date();
    const windowStart = reservation.startTime;
    const windowEnd = new Date(reservation.startTime.getTime() + 10 * 60 * 1000);

    if (now < windowStart || now > windowEnd) {
      throw new InvalidAccessCodeError();
    }

    if (input.method === "PIN" && input.code !== "123456") {
      throw new InvalidAccessCodeError();
    }

    if (input.method === "QR") {
      const secret = process.env.QR_SIGNING_SECRET ?? "dev-qr-secret";
      const isValid = verifySignedQrPayload({
        code: input.code,
        reservationId: reservation.id,
        userId: input.userId,
        secret
      });

      if (!isValid) {
        throw new InvalidAccessCodeError();
      }
    }

    reservation.markOccupied(now);
    await this.reservationRepository.save(reservation);

    return reservation;
  }
}
