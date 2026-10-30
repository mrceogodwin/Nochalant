import { createInternalNeonAuth } from "@neondatabase/auth";

const authUrl = import.meta.env.VITE_NEON_AUTH_URL;

if (!authUrl) {
  console.warn("Neon Auth is not configured. Set VITE_NEON_AUTH_URL.");
}

const neonAuth = authUrl ? createInternalNeonAuth(authUrl) : null;
export const authClient = neonAuth?.adapter ?? null;

// Keep the JWT returned by the successful sign-in response in memory. Neon
// Auth attaches it to session data via the set-auth-jwt response header.
let activeSessionToken = null;

export function rememberAuthSession(result) {
  const session = result?.data?.session ?? result?.session ?? null;
  const token =
    session?.token ||
    session?.access_token ||
    result?.data?.token ||
    result?.token ||
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
  if (!neonAuth) throw new Error("Authentication is not configured.");
  if (activeSessionToken) return activeSessionToken;

  const token = await neonAuth.getJWTToken();
  if (typeof token !== "string" || !token.trim()) return null;
  activeSessionToken = token.trim();
  return activeSessionToken;
}
