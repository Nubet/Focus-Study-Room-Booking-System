import { createHmac } from "node:crypto";

type Input = {
  reservationId: string;
  userId: string;
  exp: number;
  secret: string;
};

const toBase64Url = (value: string): string => Buffer.from(value).toString("base64url");

export const createSignedQrPayload = (input: Input): string => {
  const headerPart = toBase64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payloadPart = toBase64Url(
    JSON.stringify({
      type: "CHECK_IN_QR",
      reservationId: input.reservationId,
      userId: input.userId,
      exp: input.exp
    })
  );

  const content = `${headerPart}.${payloadPart}`;
  const signaturePart = createHmac("sha256", input.secret).update(content).digest("base64url");
  return `${content}.${signaturePart}`;
};
