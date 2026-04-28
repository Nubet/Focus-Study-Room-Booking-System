import { describe, expect, it } from "vitest";
import { Reservation } from "../../../src/domain/entities/reservation.js";

describe("Reservation", () => {
  it("creates active reservation when start is before end", () => {
    const reservation = Reservation.create({
      id: "res-1",
      roomId: "room-a",
      userId: "user-1",
      startTime: new Date("2026-05-10T10:00:00.000Z"),
      endTime: new Date("2026-05-10T11:00:00.000Z")
    });

    expect(reservation.status).toBe("ACTIVE");
  });

  it("throws when start is equal to end", () => {
    expect(() =>
      Reservation.create({
        id: "res-2",
        roomId: "room-a",
        userId: "user-1",
        startTime: new Date("2026-05-10T10:00:00.000Z"),
        endTime: new Date("2026-05-10T10:00:00.000Z")
      })
    ).toThrow();
  });

  it("throws when start is after end", () => {
    expect(() =>
      Reservation.create({
        id: "res-3",
        roomId: "room-a",
        userId: "user-1",
        startTime: new Date("2026-05-10T12:00:00.000Z"),
        endTime: new Date("2026-05-10T11:00:00.000Z")
      })
    ).toThrow();
  });
});
