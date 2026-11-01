import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

const MAX_TICKET_AGE_SECONDS = 15 * 60;

const encode = value => Buffer.from(JSON.stringify(value)).toString("base64url");
const decode = value => JSON.parse(Buffer.from(value, "base64url").toString("utf8"));

export function issuePlaybackTicket(trackId, eligibleSeconds, secret, now = Date.now()) {
  if (!secret || Buffer.byteLength(secret) < 32) throw new Error("PLAYBACK_TICKET_SECRET must contain at least 32 bytes.");
  if (typeof trackId !== "string" || !/^[0-9a-f-]{36}$/i.test(trackId)) throw new TypeError("Invalid track ID.");
  if (!Number.isSafeInteger(eligibleSeconds) || eligibleSeconds < 1 || eligibleSeconds > 86400) throw new TypeError("Invalid play threshold.");
  const payload = { v: 1, trackId, nonce: randomUUID(), issuedAt: Math.floor(now / 1000), eligibleSeconds };
  const encoded = encode(payload);
  const signature = createHmac("sha256", secret).update(encoded).digest("base64url");
  return { ticket: encoded + "." + signature, eligibleSeconds, expiresInSeconds: MAX_TICKET_AGE_SECONDS };
}

export function verifyPlaybackTicket(ticket, expectedTrackId, secret, now = Date.now()) {
  if (!secret || Buffer.byteLength(secret) < 32 || typeof ticket !== "string" || ticket.length > 2048) return null;
  const parts = ticket.split(".");
  if (parts.length !== 2) return null;
  const [encoded, suppliedSignature] = parts;
  const expectedSignature = createHmac("sha256", secret).update(encoded).digest();
  let actualSignature;
  try { actualSignature = Buffer.from(suppliedSignature, "base64url"); } catch { return null; }
  if (actualSignature.length !== expectedSignature.length || !timingSafeEqual(actualSignature, expectedSignature)) return null;
  try {
    const payload = decode(encoded);
    const nowSeconds = Math.floor(now / 1000);
    if (payload.v !== 1 || payload.trackId !== expectedTrackId ||
        typeof payload.nonce !== "string" || !/^[0-9a-f-]{36}$/i.test(payload.nonce) ||
        !Number.isSafeInteger(payload.issuedAt) || !Number.isSafeInteger(payload.eligibleSeconds) ||
        payload.eligibleSeconds < 1 || payload.eligibleSeconds > 86400 ||
        payload.issuedAt > nowSeconds + 30 ||
        nowSeconds - payload.issuedAt > MAX_TICKET_AGE_SECONDS ||
        nowSeconds - payload.issuedAt < payload.eligibleSeconds) return null;
    return payload;
  } catch { return null; }
}
