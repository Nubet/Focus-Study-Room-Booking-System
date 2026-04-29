import { describe, expect, it } from "vitest";
import { buildApp } from "@src/app/build-app.js";

describe("rooms routes", () => {
  it("returns available rooms for selected time range", async () => {
    const app = buildApp();

    await app.inject({
      method: "POST",
      url: "/reservations",
      payload: {
        id: "res-701",
        roomId: "room-a",
        userId: "user-1",
        startTime: "2026-05-10T10:00:00.000Z",
        endTime: "2026-05-10T11:00:00.000Z"
      }
    });

    const response = await app.inject({
      method: "GET",
      url: "/rooms/available?startTime=2026-05-10T10:30:00.000Z&endTime=2026-05-10T11:30:00.000Z"
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual([{ id: "room-b" }, { id: "room-c" }]);
  });

  it("returns 400 when date query is invalid", async () => {
    const app = buildApp();

    const response = await app.inject({
      method: "GET",
      url: "/rooms/available?startTime=invalid&endTime=2026-05-10T11:30:00.000Z"
    });

    expect(response.statusCode).toBe(400);
  });

  it("returns 400 when startTime is equal to endTime", async () => {
    const app = buildApp();

    const response = await app.inject({
      method: "GET",
      url: "/rooms/available?startTime=2026-05-10T11:30:00.000Z&endTime=2026-05-10T11:30:00.000Z"
    });

    expect(response.statusCode).toBe(400);
  });
});
