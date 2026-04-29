import { describe, expect, it } from "vitest";
import { buildApp } from "@src/app.js";

describe("check-in route", () => {
  it("returns 200 and occupied status for valid PIN check-in", async () => {
    const app = buildApp();

    await app.inject({
      method: "POST",
      url: "/reservations",
      payload: {
        id: "res-801",
        roomId: "room-a",
        userId: "user-1",
        startTime: "2026-05-10T10:00:00.000Z",
        endTime: "2026-05-10T11:00:00.000Z"
      }
    });

    const response = await app.inject({
      method: "POST",
      url: "/reservations/res-801/check-in",
      payload: {
        method: "PIN",
        code: "123456",
        userId: "user-1"
      }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      reservationId: "res-801",
      status: "OCCUPIED"
    });
  });

  it("returns 404 when reservation does not exist", async () => {
    const app = buildApp();

    const response = await app.inject({
      method: "POST",
      url: "/reservations/missing/check-in",
      payload: {
        method: "PIN",
        code: "123456",
        userId: "user-1"
      }
    });

    expect(response.statusCode).toBe(404);
  });

  it("returns 400 for invalid payload", async () => {
    const app = buildApp();

    const response = await app.inject({
      method: "POST",
      url: "/reservations/res-801/check-in",
      payload: {
        method: "PIN"
      }
    });

    expect(response.statusCode).toBe(400);
  });

  it("returns 409 for invalid reservation state", async () => {
    const app = buildApp();

    await app.inject({
      method: "POST",
      url: "/reservations",
      payload: {
        id: "res-802",
        roomId: "room-b",
        userId: "user-2",
        startTime: "2026-05-10T10:00:00.000Z",
        endTime: "2026-05-10T11:00:00.000Z"
      }
    });

    await app.inject({
      method: "DELETE",
      url: "/reservations/res-802"
    });

    const response = await app.inject({
      method: "POST",
      url: "/reservations/res-802/check-in",
      payload: {
        method: "PIN",
        code: "123456",
        userId: "user-2"
      }
    });

    expect(response.statusCode).toBe(409);
  });

  it("returns 403 for invalid code", async () => {
    const app = buildApp();

    await app.inject({
      method: "POST",
      url: "/reservations",
      payload: {
        id: "res-803",
        roomId: "room-c",
        userId: "user-3",
        startTime: "2026-05-10T10:00:00.000Z",
        endTime: "2026-05-10T11:00:00.000Z"
      }
    });

    const response = await app.inject({
      method: "POST",
      url: "/reservations/res-803/check-in",
      payload: {
        method: "PIN",
        code: "bad-code",
        userId: "user-3"
      }
    });

    expect(response.statusCode).toBe(403);
  });
});
