import { createHmac, timingSafeEqual } from "node:crypto";

const TOLERANCE_SECONDS = 300;

function digest(secret: string, timestamp: string, rawBody: string) {
  return createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex");
}

function matches(expected: string, signature: string) {
  const left = Buffer.from(expected);
  const right = Buffer.from(signature);
  return left.length === right.length && timingSafeEqual(left, right);
}

/** Verify a Bachs webhook. Prefer X-Bachs-Signature-V2; fall back to the v1 headers. */
export function verifyBachsSignature(rawBody: string, headers: Headers, secrets: string[]) {
  const usable = secrets.map((secret) => secret.trim()).filter(Boolean);
  if (!usable.length) return false;
  const v2 = headers.get("x-bachs-signature-v2");
  if (v2) {
    const parts = v2.split(",").map((part) => {
      const index = part.indexOf("=");
      return [part.slice(0, index), part.slice(index + 1)] as const;
    });
    const timestamp = parts.find(([key]) => key === "t")?.[1];
    const signatures = parts.filter(([key]) => key === "v1").map(([, value]) => value);
    if (!timestamp || !signatures.length) return false;
    const age = Math.abs(Date.now() / 1000 - Number(timestamp));
    if (!Number.isFinite(age) || age > TOLERANCE_SECONDS) return false;
    return usable.some((secret) => signatures.some((signature) => matches(digest(secret, timestamp, rawBody), signature)));
  }
  const timestamp = headers.get("x-bachs-timestamp");
  const signature = headers.get("x-bachs-signature");
  if (!timestamp || !signature) return false;
  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!Number.isFinite(age) || age > TOLERANCE_SECONDS) return false;
  return usable.some((secret) => matches(digest(secret, timestamp, rawBody), signature));
}

export function nairaDecimal(amount: number) {
  return `${Math.round(amount).toFixed(2)}`;
}
