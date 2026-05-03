import { createHash } from "node:crypto";

export const hashAccessCode = (value: string): string => createHash("sha256").update(value).digest("hex");
