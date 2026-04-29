import { createHmac, timingSafeEqual } from "node:crypto";

type QrPayload = {
  type: string;
  reservationId: string;
  userId: string;
  exp: number;
};

const parseJson = (value: string): unknown => {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const isQrPayload = (value: unknown): value is QrPayload => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const payload = value as Record<string, unknown>;

  return (
    typeof payload.type === "string" &&
    typeof payload.reservationId === "string" &&
    typeof payload.userId === "string" &&
    typeof payload.exp === "number"
  );
};

export const verifySignedQrPayload = (input: {
  code: string;
  reservationId: string;
  userId: string;
  secret: string;
}): boolean => {
  const parts = input.code.split(".");

  if (parts.length !== 3) {
    return false;
  }

  const [headerPart, payloadPart, signaturePart] = parts;
  const content = `${headerPart}.${payloadPart}`;
  const expectedSignature = createHmac("sha256", input.secret).update(content).digest("base64url");

  const providedSignatureBuffer = Buffer.from(signaturePart);
  const expectedSignatureBuffer = Buffer.from(expectedSignature);

  if (providedSignatureBuffer.length !== expectedSignatureBuffer.length) {
    return false;
  }

  if (!timingSafeEqual(providedSignatureBuffer, expectedSignatureBuffer)) {
    return false;
  }

  const payloadRaw = Buffer.from(payloadPart, "base64url").toString("utf8");
  const payload = parseJson(payloadRaw);

  if (!isQrPayload(payload)) {
    return false;
  }

  if (payload.type !== "CHECK_IN_QR") {
    return false;
  }

  if (payload.reservationId !== input.reservationId || payload.userId !== input.userId) {
    return false;
  }

  const nowInSeconds = Math.floor(Date.now() / 1000);
  if (payload.exp <= nowInSeconds) {
    return false;
  }

  return true;
};
