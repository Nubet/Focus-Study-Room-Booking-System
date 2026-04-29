import { describe, expect, it } from "vitest";
import { buildApp } from "@src/app.js";
import { createHmac } from "node:crypto";

const toBase64Url = (value: string): string => Buffer.from(value).toString("base64url");

const createSignedQrPayload = (payload: Record<string, unknown>, secret: string): string => {
  const headerPart = toBase64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payloadPart = toBase64Url(JSON.stringify(payload));
  const content = `${headerPart}.${payloadPart}`;
  const signature = createHmac("sha256", secret).update(content).digest("base64url");
  return `${content}.${signature}`;
};

const createActiveReservationWindow = (): { startTime: string; endTime: string } => {
  const now = Date.now();
  return {
    startTime: new Date(now - 60 * 1000).toISOString(),
    endTime: new Date(now + 59 * 60 * 1000).toISOString()
  };
};

describe("check-in route", () => {
  it("returns 200 and occupied status for valid PIN check-in", async () => {
    const app = buildApp();
    const window = createActiveReservationWindow();

    await app.inject({
      method: "POST",
      url: "/reservations",
      payload: {
        id: "res-801",
        roomId: "room-a",
        userId: "user-1",
        startTime: window.startTime,
        endTime: window.endTime
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
    expect(typeof response.json().checkedInAt).toBe("string");
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
    const window = createActiveReservationWindow();

    await app.inject({
      method: "POST",
      url: "/reservations",
      payload: {
        id: "res-802",
        roomId: "room-b",
        userId: "user-2",
        startTime: window.startTime,
        endTime: window.endTime
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
    const window = createActiveReservationWindow();

    await app.inject({
      method: "POST",
      url: "/reservations",
      payload: {
        id: "res-803",
        roomId: "room-c",
        userId: "user-3",
        startTime: window.startTime,
        endTime: window.endTime
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

  it("returns 200 for valid QR signed payload", async () => {
    const app = buildApp();
    const window = createActiveReservationWindow();

    await app.inject({
      method: "POST",
      url: "/reservations",
      payload: {
        id: "res-804",
        roomId: "room-d",
        userId: "user-4",
        startTime: window.startTime,
        endTime: window.endTime
      }
    });

    const qrCode = createSignedQrPayload(
      {
        type: "CHECK_IN_QR",
        reservationId: "res-804",
        userId: "user-4",
        iat: 1760000000,
        exp: 4102444800,
        nonce: "nonce-1"
      },
      "dev-qr-secret"
    );

    const response = await app.inject({
      method: "POST",
      url: "/reservations/res-804/check-in",
      payload: {
        method: "QR",
        code: qrCode,
        userId: "user-4"
      }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ reservationId: "res-804", status: "OCCUPIED" });
  });

  it("returns 403 for tampered QR signed payload", async () => {
    const app = buildApp();
    const window = createActiveReservationWindow();

    await app.inject({
      method: "POST",
      url: "/reservations",
      payload: {
        id: "res-805",
        roomId: "room-e",
        userId: "user-5",
        startTime: window.startTime,
        endTime: window.endTime
      }
    });

    const validQrCode = createSignedQrPayload(
      {
        type: "CHECK_IN_QR",
        reservationId: "res-805",
        userId: "user-5",
        iat: 1760000000,
        exp: 4102444800,
        nonce: "nonce-2"
      },
      "dev-qr-secret"
    );

    const tamperedQrCode = `${validQrCode}tampered`;

    const response = await app.inject({
      method: "POST",
      url: "/reservations/res-805/check-in",
      payload: {
        method: "QR",
        code: tamperedQrCode,
        userId: "user-5"
      }
    });

    expect(response.statusCode).toBe(403);
  });

  it("returns 403 for expired QR signed payload", async () => {
    const app = buildApp();
    const window = createActiveReservationWindow();

    await app.inject({
      method: "POST",
      url: "/reservations",
      payload: {
        id: "res-809",
        roomId: "room-g",
        userId: "user-9",
        startTime: window.startTime,
        endTime: window.endTime
      }
    });

    const nowInSeconds = Math.floor(Date.now() / 1000);
    const expiredQrCode = createSignedQrPayload(
      {
        type: "CHECK_IN_QR",
        reservationId: "res-809",
        userId: "user-9",
        iat: nowInSeconds - 120,
        exp: nowInSeconds - 60,
        nonce: "nonce-expired"
      },
      "dev-qr-secret"
    );

    const response = await app.inject({
      method: "POST",
      url: "/reservations/res-809/check-in",
      payload: {
        method: "QR",
        code: expiredQrCode,
        userId: "user-9"
      }
    });

    expect(response.statusCode).toBe(403);
  });

  it("returns 403 for QR payload with invalid type", async () => {
    const app = buildApp();
    const window = createActiveReservationWindow();

    await app.inject({
      method: "POST",
      url: "/reservations",
      payload: {
        id: "res-810",
        roomId: "room-h",
        userId: "user-10",
        startTime: window.startTime,
        endTime: window.endTime
      }
    });

    const qrCode = createSignedQrPayload(
      {
        type: "WRONG_TYPE",
        reservationId: "res-810",
        userId: "user-10",
        iat: 1760000000,
        exp: 4102444800,
        nonce: "nonce-wrong-type"
      },
      "dev-qr-secret"
    );

    const response = await app.inject({
      method: "POST",
      url: "/reservations/res-810/check-in",
      payload: {
        method: "QR",
        code: qrCode,
        userId: "user-10"
      }
    });

    expect(response.statusCode).toBe(403);
  });

  it("returns 403 for QR payload reservationId mismatch", async () => {
    const app = buildApp();
    const window = createActiveReservationWindow();

    await app.inject({
      method: "POST",
      url: "/reservations",
      payload: {
        id: "res-811",
        roomId: "room-i",
        userId: "user-11",
        startTime: window.startTime,
        endTime: window.endTime
      }
    });

    const qrCode = createSignedQrPayload(
      {
        type: "CHECK_IN_QR",
        reservationId: "res-other",
        userId: "user-11",
        iat: 1760000000,
        exp: 4102444800,
        nonce: "nonce-res-mismatch"
      },
      "dev-qr-secret"
    );

    const response = await app.inject({
      method: "POST",
      url: "/reservations/res-811/check-in",
      payload: {
        method: "QR",
        code: qrCode,
        userId: "user-11"
      }
    });

    expect(response.statusCode).toBe(403);
  });

  it("returns 403 for QR payload userId mismatch", async () => {
    const app = buildApp();
    const window = createActiveReservationWindow();

    await app.inject({
      method: "POST",
      url: "/reservations",
      payload: {
        id: "res-812",
        roomId: "room-j",
        userId: "user-12",
        startTime: window.startTime,
        endTime: window.endTime
      }
    });

    const qrCode = createSignedQrPayload(
      {
        type: "CHECK_IN_QR",
        reservationId: "res-812",
        userId: "user-other",
        iat: 1760000000,
        exp: 4102444800,
        nonce: "nonce-user-mismatch"
      },
      "dev-qr-secret"
    );

    const response = await app.inject({
      method: "POST",
      url: "/reservations/res-812/check-in",
      payload: {
        method: "QR",
        code: qrCode,
        userId: "user-12"
      }
    });

    expect(response.statusCode).toBe(403);
  });

  it("returns 403 when check-in is outside allowed time window", async () => {
    const app = buildApp();

    await app.inject({
      method: "POST",
      url: "/reservations",
      payload: {
        id: "res-806",
        roomId: "room-f",
        userId: "user-6",
        startTime: "2020-05-10T10:00:00.000Z",
        endTime: "2020-05-10T11:00:00.000Z"
      }
    });

    const response = await app.inject({
      method: "POST",
      url: "/reservations/res-806/check-in",
      payload: {
        method: "PIN",
        code: "123456",
        userId: "user-6"
      }
    });

    expect(response.statusCode).toBe(403);
  });
});
