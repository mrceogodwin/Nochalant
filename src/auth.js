import { createAuthClient } from "@neondatabase/auth";

const authUrl = import.meta.env.VITE_NEON_AUTH_URL;

if (!authUrl) {
  console.warn("Neon Auth is not configured. Set VITE_NEON_AUTH_URL.");
}

export const authClient = authUrl ? createAuthClient(authUrl) : null;

// The public createAuthClient() API exposes the Better Auth client directly.
// Calling an unsupported getJWTToken() method on its proxy can become a request
// to /get-jwt-token (404). Neon Auth's JWT plugin exposes the token at /token.
export async function getAuthToken() {
  if (!authUrl) throw new Error("Authentication is not configured.");
  const base = authUrl.endsWith("/") ? authUrl.slice(0, -1) : authUrl;
  const response = await fetch(`${base}/token`, {
    method: "GET",
    credentials: "include",
    headers: { Accept: "application/json" }
  });
  const raw = await response.text();
  let payload = raw;
  try { payload = raw ? JSON.parse(raw) : null; } catch { /* token may be returned as plain text */ }
  if (!response.ok) {
    const message = payload && typeof payload === "object" ? payload.message || payload.error : null;
    throw new Error(message || (response.status === 401 ? "Please sign in again to continue." : "Could not obtain a secure sign-in token."));
  }
  const token = typeof payload === "string" ? payload : payload?.token || payload?.data?.token;
  if (typeof token !== "string" || !token.trim()) throw new Error("Your session is active, but Neon Auth did not return an API token. Please sign in again.");
  return token.trim();
}
