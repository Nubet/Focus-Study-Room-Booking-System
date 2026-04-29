import { describe, expect, it } from "vitest";
import { hasTimeOverlap } from "@src/modules/reservations/domain/policies/overlap-policy.js";

describe("hasTimeOverlap", () => {
  it("returns true when windows overlap", () => {
    const result = hasTimeOverlap(
      new Date("2026-05-10T10:00:00.000Z"),
      new Date("2026-05-10T11:00:00.000Z"),
      new Date("2026-05-10T10:30:00.000Z"),
      new Date("2026-05-10T11:30:00.000Z")
    );

    expect(result).toBe(true);
  });

  it("returns false when one window ends at another start", () => {
    const result = hasTimeOverlap(
      new Date("2026-05-10T10:00:00.000Z"),
      new Date("2026-05-10T11:00:00.000Z"),
      new Date("2026-05-10T11:00:00.000Z"),
      new Date("2026-05-10T12:00:00.000Z")
    );

    expect(result).toBe(false);
  });

  it("returns false when windows are separate", () => {
    const result = hasTimeOverlap(
      new Date("2026-05-10T10:00:00.000Z"),
      new Date("2026-05-10T11:00:00.000Z"),
      new Date("2026-05-10T12:00:00.000Z"),
      new Date("2026-05-10T13:00:00.000Z")
    );

    expect(result).toBe(false);
  });
});
