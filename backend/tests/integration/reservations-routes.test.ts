import { describe, expect, it } from "vitest";
import { buildApp } from "@src/app.js";

describe("reservations routes", () => {
  it("returns 400 when required fields are missing", async () => {
    const app = buildApp();

    const response = await app.inject({
      method: "POST",
      url: "/reservations",
      payload: {
        id: "res-600",
        roomId: "room-a",
        userId: "user-1",
        startTime: "2026-05-10T10:00:00.000Z"
      }
    });

    expect(response.statusCode).toBe(400);
  });

  it("returns 400 when date fields are invalid", async () => {
    const app = buildApp();

    const response = await app.inject({
      method: "POST",
      url: "/reservations",
      payload: {
        id: "res-600b",
        roomId: "room-a",
        userId: "user-1",
        startTime: "invalid-date",
        endTime: "2026-05-10T11:00:00.000Z"
      }
    });

    expect(response.statusCode).toBe(400);
  });

  it("creates reservation via POST /reservations", async () => {
    const app = buildApp();

    const response = await app.inject({
      method: "POST",
      url: "/reservations",
      payload: {
        id: "res-601",
        roomId: "room-a",
        userId: "user-1",
        startTime: "2026-05-10T10:00:00.000Z",
        endTime: "2026-05-10T11:00:00.000Z"
      }
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({
      id: "res-601",
      status: "ACTIVE"
    });
  });

  it("returns conflict when slot is already reserved", async () => {
    const app = buildApp();

    await app.inject({
      method: "POST",
      url: "/reservations",
      payload: {
        id: "res-602",
        roomId: "room-a",
        userId: "user-1",
        startTime: "2026-05-10T10:00:00.000Z",
        endTime: "2026-05-10T11:00:00.000Z"
      }
    });

    const conflictResponse = await app.inject({
      method: "POST",
      url: "/reservations",
      payload: {
        id: "res-603",
        roomId: "room-a",
        userId: "user-2",
        startTime: "2026-05-10T10:30:00.000Z",
        endTime: "2026-05-10T11:30:00.000Z"
      }
    });

    expect(conflictResponse.statusCode).toBe(409);
  });

  it("returns user reservations via GET /reservations/me", async () => {
    const app = buildApp();

    await app.inject({
      method: "POST",
      url: "/reservations",
      payload: {
        id: "res-604",
        roomId: "room-b",
        userId: "user-7",
        startTime: "2026-05-10T12:00:00.000Z",
        endTime: "2026-05-10T13:00:00.000Z"
      }
    });

    await app.inject({
      method: "POST",
      url: "/reservations",
      payload: {
        id: "res-605",
        roomId: "room-c",
        userId: "user-9",
        startTime: "2026-05-10T14:00:00.000Z",
        endTime: "2026-05-10T15:00:00.000Z"
      }
    });

    const response = await app.inject({
      method: "GET",
      url: "/reservations/me?userId=user-7"
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toHaveLength(1);
    expect(response.json()[0]).toMatchObject({ id: "res-604", userId: "user-7" });
  });

  it("cancels reservation via DELETE /reservations/:id", async () => {
    const app = buildApp();

    await app.inject({
      method: "POST",
      url: "/reservations",
      payload: {
        id: "res-606",
        roomId: "room-d",
        userId: "user-3",
        startTime: "2026-05-10T16:00:00.000Z",
        endTime: "2026-05-10T17:00:00.000Z"
      }
    });

    const response = await app.inject({
      method: "DELETE",
      url: "/reservations/res-606"
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ id: "res-606", status: "CANCELLED" });
  });
});
