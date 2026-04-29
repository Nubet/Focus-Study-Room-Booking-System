import { Reservation } from "../../domain/entities/reservation.js";
import { SlotAlreadyReservedError } from "../../domain/errors/reservation-errors.js";

type CreateReservationInput = {
  id: string;
  roomId: string;
  userId: string;
  startTime: Date;
  endTime: Date;
};

type ReservationRepository = {
  save: (reservation: Reservation) => Promise<void>;
  findByRoomInTimeRange: (
    roomId: string,
    startTime: Date,
    endTime: Date
  ) => Promise<Reservation[]>;
};

export class CreateReservationUseCase {
  constructor(private readonly reservationRepository: ReservationRepository) {}

  async execute(input: CreateReservationInput): Promise<Reservation> {
    const conflictingReservations = await this.reservationRepository.findByRoomInTimeRange(
      input.roomId,
      input.startTime,
      input.endTime
    );

    if (conflictingReservations.length > 0) {
      throw new SlotAlreadyReservedError();
    }

    const reservation = Reservation.create(input);
    await this.reservationRepository.save(reservation);

    return reservation;
  }
}
