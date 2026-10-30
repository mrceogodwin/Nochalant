import { createAuthClient } from "@neondatabase/auth";

const authUrl = import.meta.env.VITE_NEON_AUTH_URL;

if (!authUrl) {
  console.warn("Neon Auth is not configured. Set VITE_NEON_AUTH_URL.");
}

export const authClient = authUrl ? createAuthClient(authUrl) : null;

// Neon Auth's SDK reads the set-auth-jwt response header and injects that
// signed JWT into session.token before updating the Better Auth session cache.
// In this SDK integration, session.token is therefore the backend JWT.
let activeSessionToken = null;

export function rememberAuthSession(result) {
  const session = result?.data?.session ?? result?.session ?? null;
  const token = session?.token ?? null;
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
  const token = session?.token ?? null;
  if (typeof token !== "string" || !token.trim()) return null;

  activeSessionToken = token.trim();
  return activeSessionToken;
}
