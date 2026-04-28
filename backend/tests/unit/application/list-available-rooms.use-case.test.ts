import { describe, expect, it } from "vitest";
import { ListAvailableRoomsUseCase } from "@src/application/use-cases/list-available-rooms.use-case.js";
import { Reservation } from "@src/domain/entities/reservation.js";

type Room = {
  id: string;
};

type RoomRepository = {
  findAll: () => Promise<Room[]>;
};

type ReservationRepository = {
  findByTimeRange: (startTime: Date, endTime: Date) => Promise<Reservation[]>;
};

const createRoomRepository = (rooms: Room[]): RoomRepository => {
  return {
    findAll: async () => rooms
  };
};

const createReservationRepository = (
  reservations: Reservation[]
): ReservationRepository => {
  return {
    findByTimeRange: async (startTime, endTime) =>
      reservations.filter(
        (reservation) =>
          reservation.startTime < endTime && reservation.endTime > startTime
      )
  };
};

describe("ListAvailableRoomsUseCase", () => {
  it("returns only rooms available for selected time range", async () => {
    const rooms = [{ id: "room-a" }, { id: "room-b" }, { id: "room-c" }];
    const reservations = [
      Reservation.create({
        id: "res-501",
        roomId: "room-b",
        userId: "user-1",
        startTime: new Date("2026-05-10T10:00:00.000Z"),
        endTime: new Date("2026-05-10T11:00:00.000Z")
      })
    ];

    const roomRepository = createRoomRepository(rooms);
    const reservationRepository = createReservationRepository(reservations);
    const useCase = new ListAvailableRoomsUseCase(roomRepository, reservationRepository);

    const result = await useCase.execute({
      startTime: new Date("2026-05-10T10:30:00.000Z"),
      endTime: new Date("2026-05-10T11:30:00.000Z")
    });

    expect(result.map((room) => room.id)).toEqual(["room-a", "room-c"]);
  });
});
