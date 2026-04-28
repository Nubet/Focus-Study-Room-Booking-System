import { describe, expect, it } from "vitest";
import { CreateReservationUseCase } from "@src/application/use-cases/create-reservation.use-case.js";
import { Reservation } from "@src/domain/entities/reservation.js";

type InMemoryReservationRepository = {
  save: (reservation: Reservation) => Promise<void>;
  findByRoomInTimeRange: (
    roomId: string,
    startTime: Date,
    endTime: Date
  ) => Promise<Reservation[]>;
};

const createRepository = (): InMemoryReservationRepository => {
  const items: Reservation[] = [];

  return {
    save: async (reservation) => {
      items.push(reservation);
    },
    findByRoomInTimeRange: async (roomId, startTime, endTime) => {
      return items.filter(
        (item) =>
          item.roomId === roomId && item.startTime < endTime && item.endTime > startTime
      );
    }
  };
};

describe("CreateReservationUseCase", () => {
  it("creates reservation when slot is available", async () => {
    const repository = createRepository();
    const useCase = new CreateReservationUseCase(repository);

    const result = await useCase.execute({
      id: "res-101",
      roomId: "room-a",
      userId: "user-1",
      startTime: new Date("2026-05-10T10:00:00.000Z"),
      endTime: new Date("2026-05-10T11:00:00.000Z")
    });

    expect(result.status).toBe("ACTIVE");
    expect(result.id).toBe("res-101");
  });

  it("throws when slot overlaps existing reservation", async () => {
    const repository = createRepository();
    const useCase = new CreateReservationUseCase(repository);

    await useCase.execute({
      id: "res-201",
      roomId: "room-a",
      userId: "user-1",
      startTime: new Date("2026-05-10T10:00:00.000Z"),
      endTime: new Date("2026-05-10T11:00:00.000Z")
    });

    await expect(
      useCase.execute({
        id: "res-202",
        roomId: "room-a",
        userId: "user-2",
        startTime: new Date("2026-05-10T10:30:00.000Z"),
        endTime: new Date("2026-05-10T11:30:00.000Z")
      })
    ).rejects.toThrow();
  });
});
