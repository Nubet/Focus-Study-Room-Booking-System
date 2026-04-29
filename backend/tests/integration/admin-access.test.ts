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
});
