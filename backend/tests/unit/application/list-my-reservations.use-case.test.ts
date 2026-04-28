import { describe, expect, it } from "vitest";
import { ListMyReservationsUseCase } from "@src/application/use-cases/list-my-reservations.use-case.js";
import { Reservation } from "@src/domain/entities/reservation.js";

type ReservationRepository = {
  findByUserId: (userId: string) => Promise<Reservation[]>;
};

const createRepository = (items: Reservation[]): ReservationRepository => {
  return {
    findByUserId: async (userId) => items.filter((item) => item.userId === userId)
  };
};

describe("ListMyReservationsUseCase", () => {
  it("returns only reservations that belong to selected user", async () => {
    const reservations = [
      Reservation.create({
        id: "res-401",
        roomId: "room-a",
        userId: "user-1",
        startTime: new Date("2026-05-10T08:00:00.000Z"),
        endTime: new Date("2026-05-10T09:00:00.000Z")
      }),
      Reservation.create({
        id: "res-402",
        roomId: "room-b",
        userId: "user-2",
        startTime: new Date("2026-05-10T09:00:00.000Z"),
        endTime: new Date("2026-05-10T10:00:00.000Z")
      }),
      Reservation.create({
        id: "res-403",
        roomId: "room-c",
        userId: "user-1",
        startTime: new Date("2026-05-10T11:00:00.000Z"),
        endTime: new Date("2026-05-10T12:00:00.000Z")
      })
    ];
    const repository = createRepository(reservations);
    const useCase = new ListMyReservationsUseCase(repository);

    const result = await useCase.execute({ userId: "user-1" });

    expect(result).toHaveLength(2);
    expect(result.map((item) => item.id)).toEqual(["res-401", "res-403"]);
  });
});
