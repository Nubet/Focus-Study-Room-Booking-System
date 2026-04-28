import { Reservation } from "../../domain/entities/reservation.js";

type CancelReservationInput = {
  reservationId: string;
};

type ReservationRepository = {
  findById: (id: string) => Promise<Reservation | null>;
  save: (reservation: Reservation) => Promise<void>;
};

export class CancelReservationUseCase {
  constructor(private readonly reservationRepository: ReservationRepository) {}

  async execute(input: CancelReservationInput): Promise<Reservation> {
    const reservation = await this.reservationRepository.findById(input.reservationId);

    if (!reservation) {
      throw new Error("Reservation not found");
    }

    reservation.cancel();
    await this.reservationRepository.save(reservation);

    return reservation;
  }
}
