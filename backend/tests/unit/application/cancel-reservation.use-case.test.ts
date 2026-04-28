import { describe, expect, it } from "vitest";
import { CancelReservationUseCase } from "@src/application/use-cases/cancel-reservation.use-case.js";
import { Reservation } from "@src/domain/entities/reservation.js";

type ReservationRepository = {
  findById: (id: string) => Promise<Reservation | null>;
  save: (reservation: Reservation) => Promise<void>;
};

const createRepository = (initial: Reservation[] = []): ReservationRepository => {
  const items = new Map(initial.map((item) => [item.id, item]));

  return {
    findById: async (id) => items.get(id) ?? null,
    save: async (reservation) => {
      items.set(reservation.id, reservation);
    }
  };
};

describe("CancelReservationUseCase", () => {
  it("marks reservation as cancelled", async () => {
    const reservation = Reservation.create({
      id: "res-301",
      roomId: "room-a",
      userId: "user-1",
      startTime: new Date("2026-05-10T10:00:00.000Z"),
      endTime: new Date("2026-05-10T11:00:00.000Z")
    });
    const repository = createRepository([reservation]);
    const useCase = new CancelReservationUseCase(repository);

    const result = await useCase.execute({ reservationId: "res-301" });

    expect(result.status).toBe("CANCELLED");
  });

  it("throws when reservation does not exist", async () => {
    const repository = createRepository();
    const useCase = new CancelReservationUseCase(repository);

    await expect(
      useCase.execute({ reservationId: "missing-id" })
    ).rejects.toThrow();
  });
});
