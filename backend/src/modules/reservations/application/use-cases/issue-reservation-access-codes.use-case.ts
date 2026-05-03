import { randomInt } from "node:crypto";
import { InvalidPayloadError, ReservationNotFoundError, ReservationStateConflictError } from "../../domain/errors/reservation-errors.js";
import { Reservation } from "../../domain/entities/reservation.js";
import { createSignedQrPayload } from "../../../../shared/security/qr-signed-payload-signer.js";
import { hashAccessCode } from "../../../../shared/security/check-in-code-hash.js";

type Input = {
  reservationId: string;
  userId: string;
};

type Output = {
  reservationId: string;
  pin: string;
  qrPayload: string;
  expiresAt: string;
};

type ReservationRepository = {
  findById: (id: string) => Promise<Reservation | null>;
  upsertCheckInCode: (input: {
    reservationId: string;
    userId: string;
    pinHash: string;
    qrHash: string;
    expiresAt: Date;
  }) => Promise<void>;
};

export class IssueReservationAccessCodesUseCase {
  constructor(private readonly reservationRepository: ReservationRepository) {}

  async execute(input: Input): Promise<Output> {
    if (!input.reservationId || !input.userId) {
      throw new InvalidPayloadError();
    }

    const reservation = await this.reservationRepository.findById(input.reservationId);

    if (!reservation || reservation.userId !== input.userId) {
      throw new ReservationNotFoundError();
    }

    if (reservation.status !== "RESERVED") {
      throw new ReservationStateConflictError();
    }

    const pin = String(randomInt(0, 1000000)).padStart(6, "0");
    const expiresAt = new Date(reservation.startTime.getTime() + 10 * 60 * 1000);
    const exp = Math.floor(expiresAt.getTime() / 1000);
    const qrPayload = createSignedQrPayload({
      reservationId: reservation.id,
      userId: reservation.userId,
      exp,
      secret: process.env.QR_SIGNING_SECRET ?? "dev-qr-secret"
    });

    await this.reservationRepository.upsertCheckInCode({
      reservationId: reservation.id,
      userId: reservation.userId,
      pinHash: hashAccessCode(pin),
      qrHash: hashAccessCode(qrPayload),
      expiresAt
    });

    return {
      reservationId: reservation.id,
      pin,
      qrPayload,
      expiresAt: expiresAt.toISOString()
    };
  }
}
