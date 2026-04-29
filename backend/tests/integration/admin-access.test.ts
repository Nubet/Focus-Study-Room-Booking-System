import { describe, expect, it } from "vitest";
import { buildApp } from "@src/app.js";

describe("admin access guard", () => {
  it("returns 403 for non-admin role", async () => {
    const app = buildApp();

    const response = await app.inject({
      method: "GET",
      url: "/admin/rooms",
      headers: {
        "x-role": "STUDENT"
      }
    });

    expect(response.statusCode).toBe(403);
  });

  it("allows access for admin role", async () => {
    const app = buildApp();

    const response = await app.inject({
      method: "GET",
      url: "/admin/rooms",
      headers: {
        "x-role": "ADMIN"
      }
    });

    expect(response.statusCode).toBe(200);
  });

  it("creates room for admin role", async () => {
    const app = buildApp();

    const response = await app.inject({
      method: "POST",
      url: "/admin/rooms",
      headers: {
        "x-role": "ADMIN"
      },
      payload: {
        id: "room-z"
      }
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({ id: "room-z" });
  });

  it("returns 400 for invalid create room payload", async () => {
    const app = buildApp();

    const response = await app.inject({
      method: "POST",
      url: "/admin/rooms",
      headers: {
        "x-role": "ADMIN"
      },
      payload: {}
    });

    expect(response.statusCode).toBe(400);
  });

  it("returns 409 when creating duplicate room id", async () => {
    const app = buildApp();

    await app.inject({
      method: "POST",
      url: "/admin/rooms",
      headers: {
        "x-role": "ADMIN"
      },
      payload: {
        id: "room-dup"
      }
    });

    const duplicateResponse = await app.inject({
      method: "POST",
      url: "/admin/rooms",
      headers: {
        "x-role": "ADMIN"
      },
      payload: {
        id: "room-dup"
      }
    });

    expect(duplicateResponse.statusCode).toBe(409);
  });

  it("updates room id for admin role", async () => {
    const app = buildApp();

    const response = await app.inject({
      method: "PATCH",
      url: "/admin/rooms/room-a",
      headers: {
        "x-role": "ADMIN"
      },
      payload: {
        id: "room-a-updated"
      }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ id: "room-a-updated" });
  });

  it("returns 404 when updating missing room", async () => {
    const app = buildApp();

    const response = await app.inject({
      method: "PATCH",
      url: "/admin/rooms/missing-room",
      headers: {
        "x-role": "ADMIN"
      },
      payload: {
        id: "new-id"
      }
    });

    expect(response.statusCode).toBe(404);
  });

  it("returns 400 for invalid update room payload", async () => {
    const app = buildApp();

    const response = await app.inject({
      method: "PATCH",
      url: "/admin/rooms/room-a",
      headers: {
        "x-role": "ADMIN"
      },
      payload: {
        id: ""
      }
    });

    expect(response.statusCode).toBe(400);
  });

  it("deletes room for admin role", async () => {
    const app = buildApp();

    const response = await app.inject({
      method: "DELETE",
      url: "/admin/rooms/room-c",
      headers: {
        "x-role": "ADMIN"
      }
    });

    expect(response.statusCode).toBe(204);
  });

  it("returns 404 when deleting missing room", async () => {
    const app = buildApp();

    const response = await app.inject({
      method: "DELETE",
      url: "/admin/rooms/missing-room",
      headers: {
        "x-role": "ADMIN"
      }
    });

    expect(response.statusCode).toBe(404);
  });

  it("lists all reservations for admin role", async () => {
    const app = buildApp();

    await app.inject({
      method: "POST",
      url: "/reservations",
      payload: {
        id: "res-admin-1",
        roomId: "room-a",
        userId: "user-a",
        startTime: "2026-05-10T10:00:00.000Z",
        endTime: "2026-05-10T11:00:00.000Z"
      }
    });

    await app.inject({
      method: "POST",
      url: "/reservations",
      payload: {
        id: "res-admin-2",
        roomId: "room-b",
        userId: "user-b",
        startTime: "2026-05-10T11:00:00.000Z",
        endTime: "2026-05-10T12:00:00.000Z"
      }
    });

    const response = await app.inject({
      method: "GET",
      url: "/admin/reservations",
      headers: {
        "x-role": "ADMIN"
      }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().length).toBeGreaterThanOrEqual(2);
  });

  it("filters reservations by status for admin role", async () => {
    const app = buildApp();

    await app.inject({
      method: "POST",
      url: "/reservations",
      payload: {
        id: "res-admin-3",
        roomId: "room-a",
        userId: "user-c",
        startTime: "2026-05-10T13:00:00.000Z",
        endTime: "2026-05-10T14:00:00.000Z"
      }
    });

    await app.inject({
      method: "POST",
      url: "/reservations",
      payload: {
        id: "res-admin-4",
        roomId: "room-b",
        userId: "user-d",
        startTime: "2026-05-10T14:00:00.000Z",
        endTime: "2026-05-10T15:00:00.000Z"
      }
    });

    await app.inject({
      method: "DELETE",
      url: "/reservations/res-admin-4"
    });

    const response = await app.inject({
      method: "GET",
      url: "/admin/reservations?status=CANCELLED",
      headers: {
        "x-role": "ADMIN"
      }
    });

    expect(response.statusCode).toBe(200);
    const statuses = response.json().map((item: { status: string }) => item.status);
    expect(statuses.every((status: string) => status === "CANCELLED")).toBe(true);
  });

  it("updates reservation status for admin role", async () => {
    const app = buildApp();

    await app.inject({
      method: "POST",
      url: "/reservations",
      payload: {
        id: "res-admin-5",
        roomId: "room-a",
        userId: "user-e",
        startTime: "2026-05-10T16:00:00.000Z",
        endTime: "2026-05-10T17:00:00.000Z"
      }
    });

    const response = await app.inject({
      method: "PATCH",
      url: "/admin/reservations/res-admin-5/status",
      headers: {
        "x-role": "ADMIN"
      },
      payload: {
        status: "COMPLETED"
      }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ id: "res-admin-5", status: "COMPLETED" });
  });

  it("returns 404 when updating missing reservation status", async () => {
    const app = buildApp();

    const response = await app.inject({
      method: "PATCH",
      url: "/admin/reservations/missing-res/status",
      headers: {
        "x-role": "ADMIN"
      },
      payload: {
        status: "COMPLETED"
      }
    });

    expect(response.statusCode).toBe(404);
  });

  it("returns 400 for invalid reservation status update payload", async () => {
    const app = buildApp();

    await app.inject({
      method: "POST",
      url: "/reservations",
      payload: {
        id: "res-admin-6",
        roomId: "room-b",
        userId: "user-f",
        startTime: "2026-05-10T18:00:00.000Z",
        endTime: "2026-05-10T19:00:00.000Z"
      }
    });

    const response = await app.inject({
      method: "PATCH",
      url: "/admin/reservations/res-admin-6/status",
      headers: {
        "x-role": "ADMIN"
      },
      payload: {
        status: "WRONG"
      }
    });

    expect(response.statusCode).toBe(400);
  });

  it("returns 409 for invalid reservation status transition", async () => {
    const app = buildApp();

    await app.inject({
      method: "POST",
      url: "/reservations",
      payload: {
        id: "res-admin-7",
        roomId: "room-b",
        userId: "user-g",
        startTime: "2026-05-10T18:00:00.000Z",
        endTime: "2026-05-10T19:00:00.000Z"
      }
    });

    await app.inject({
      method: "PATCH",
      url: "/admin/reservations/res-admin-7/status",
      headers: {
        "x-role": "ADMIN"
      },
      payload: {
        status: "CANCELLED"
      }
    });

    const invalidTransitionResponse = await app.inject({
      method: "PATCH",
      url: "/admin/reservations/res-admin-7/status",
      headers: {
        "x-role": "ADMIN"
      },
      payload: {
        status: "RESERVED"
      }
    });

    expect(invalidTransitionResponse.statusCode).toBe(409);
  });
});
