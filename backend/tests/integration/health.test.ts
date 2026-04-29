import { describe, expect, it } from "vitest";
import { buildApp } from "@src/app/build-app.js";

describe("health route", () => {
  it("returns ok status", async () => {
    const app = buildApp();

    const response = await app.inject({
      method: "GET",
      url: "/health"
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: "ok" });
  });
});
