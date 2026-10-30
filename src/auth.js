import { createInternalNeonAuth } from "@neondatabase/auth";

const authUrl = import.meta.env.VITE_NEON_AUTH_URL;

if (!authUrl) {
  console.warn("Neon Auth is not configured. Set VITE_NEON_AUTH_URL.");
}

// createAuthClient() returns only the Better Auth adapter. The SDK's
// createInternalNeonAuth() exposes both that adapter and getJWTToken().
const neonAuth = authUrl ? createInternalNeonAuth(authUrl) : null;

export const authClient = neonAuth?.adapter ?? null;

export async function getAuthToken() {
  if (!neonAuth) throw new Error("Authentication is not configured.");

  const token = await neonAuth.getJWTToken();
  if (typeof token !== "string" || !token.trim()) return null;
  return token.trim();
}
