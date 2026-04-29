import { Reservation } from "../../../reservations/domain/entities/reservation.js";

type Room = {
  id: string;
};

type RoomRepository = {
  findAll: () => Promise<Room[]>;
};

type ReservationRepository = {
  findByTimeRange: (startTime: Date, endTime: Date) => Promise<Reservation[]>;
};

type ListAvailableRoomsInput = {
  startTime: Date;
  endTime: Date;
};

export class ListAvailableRoomsUseCase {
  constructor(
    private readonly roomRepository: RoomRepository,
    private readonly reservationRepository: ReservationRepository
  ) {}

  async execute(input: ListAvailableRoomsInput): Promise<Room[]> {
    const [rooms, overlappingReservations] = await Promise.all([
      this.roomRepository.findAll(),
      this.reservationRepository.findByTimeRange(input.startTime, input.endTime)
    ]);

    const reservedRoomIds = new Set(overlappingReservations.map((item) => item.roomId));

    return rooms.filter((room) => !reservedRoomIds.has(room.id));
  }
}
