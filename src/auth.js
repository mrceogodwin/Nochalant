import { createAuthClient } from "@neondatabase/auth";

const authUrl = import.meta.env.VITE_NEON_AUTH_URL;

if (!authUrl) {
  console.warn("Neon Auth is not configured. Set VITE_NEON_AUTH_URL.");
}

export const authClient = authUrl ? createAuthClient(authUrl) : null;

// Neon Auth exposes the JWKS-verifiable JWT as session.access_token.
// session.token is the opaque Better Auth cookie/session identifier and must
// never be sent to APIs that verify JWTs with the Neon Auth JWKS.
let activeSessionToken = null;

export function rememberAuthSession(result) {
  const session = result?.data?.session ?? result?.session ?? null;
  const token =
    session?.access_token ||
    result?.data?.session?.access_token ||
    null;

  if (typeof token === "string" && token.trim()) {
    activeSessionToken = token.trim();
  }
  return result?.data?.user ?? result?.user ?? null;
}

export function clearRememberedAuthSession() {
  activeSessionToken = null;
}

export async function getAuthToken() {
  if (!authClient) throw new Error("Authentication is not configured.");
  if (activeSessionToken) return activeSessionToken;

  const result = await authClient.getSession();
  if (result?.error) {
    throw new Error(result.error.message || "Your Neon Auth session could not be retrieved.");
  }
  const session = result?.data?.session ?? result?.session ?? null;
  const token = session?.access_token ?? null;
  if (typeof token !== "string" || !token.trim()) return null;

  activeSessionToken = token.trim();
  return activeSessionToken;
}
