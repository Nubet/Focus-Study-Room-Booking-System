import { describe, expect, it } from "vitest";
import { buildApp } from "@src/app/build-app.js";

describe("admin openapi contract", () => {
  it("exposes admin endpoints in openapi paths", async () => {
    const app = buildApp();

    const response = await app.inject({
      method: "GET",
      url: "/docs/json"
    });

    expect(response.statusCode).toBe(200);
    const spec = response.json();

    expect(spec.paths["/admin/rooms"]).toBeDefined();
    expect(spec.paths["/admin/rooms/{id}"]).toBeDefined();
    expect(spec.paths["/admin/reservations"]).toBeDefined();
    expect(spec.paths["/admin/reservations/{id}/status"]).toBeDefined();
  });

  it("includes request examples for admin write endpoints", async () => {
    const app = buildApp();

    const response = await app.inject({
      method: "GET",
      url: "/docs/json"
    });

    const spec = response.json();

    const createRoomExample = spec.paths["/admin/rooms"].post.requestBody.content["application/json"].example;
    const updateRoomExample =
      spec.paths["/admin/rooms/{id}"].patch.requestBody.content["application/json"].example;
    const updateStatusExample =
      spec.paths["/admin/reservations/{id}/status"].patch.requestBody.content["application/json"].example;

    expect(createRoomExample).toBeDefined();
    expect(updateRoomExample).toBeDefined();
    expect(updateStatusExample).toBeDefined();
  });
});
