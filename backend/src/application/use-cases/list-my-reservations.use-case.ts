import { Reservation } from "../../domain/entities/reservation.js";

type ListMyReservationsInput = {
  userId: string;
};

type ReservationRepository = {
  findByUserId: (userId: string) => Promise<Reservation[]>;
};

export class ListMyReservationsUseCase {
  constructor(private readonly reservationRepository: ReservationRepository) {}

  async execute(input: ListMyReservationsInput): Promise<Reservation[]> {
    return this.reservationRepository.findByUserId(input.userId);
  }
}
