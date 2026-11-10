import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDb, type Row } from "./db";
import { mapUser } from "./map";
import type { User } from "./types";

const COOKIE = "nc_session";

export function newToken() {
  return randomBytes(32).toString("hex");
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  };
}

export async function createSession(userId: string) {
  if (!process.env.AUTH_SECRET || process.env.AUTH_SECRET.length < 16) {
    throw new Error("AUTH_SECRET must be set to a long random string");
  }
  const token = newToken();
  const db = getDb();
  await db`
    INSERT INTO social.sessions (user_id, token_hash, expires_at)
    VALUES (${userId}, ${hashToken(token)}, now() + interval '30 days')
  `;
  const jar = await cookies();
  jar.set(COOKIE, token, cookieOptions());
}

export async function clearSession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) {
    const db = getDb();
    await db`DELETE FROM social.sessions WHERE token_hash = ${hashToken(token)}`;
  }
  jar.delete(COOKIE);
}

export async function getCurrentUser(): Promise<User | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  const db = getDb();
  const rows = (await db`
    SELECT u.*
    FROM social.users u
    JOIN social.sessions s ON s.user_id = u.id
    WHERE s.token_hash = ${hashToken(token)} AND s.expires_at > now()
    LIMIT 1
  `) as Row[];
  return rows[0] ? mapUser(rows[0]) : null;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");
  return user;
}

export function googleConfigured() {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export function appleConfigured() {
  return Boolean(
    process.env.APPLE_CLIENT_ID &&
      process.env.APPLE_TEAM_ID &&
      process.env.APPLE_KEY_ID &&
      process.env.APPLE_PRIVATE_KEY,
  );
}

export function paystackConfigured() {
  return Boolean(process.env.PAYSTACK_SECRET_KEY);
}

export function livekitConfigured() {
  return Boolean(process.env.LIVEKIT_URL && process.env.LIVEKIT_API_KEY && process.env.LIVEKIT_API_SECRET);
}
