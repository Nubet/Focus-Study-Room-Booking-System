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
});
