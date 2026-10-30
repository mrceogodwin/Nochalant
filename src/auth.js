import { createAuthClient } from "@neondatabase/auth";

const authUrl = import.meta.env.VITE_NEON_AUTH_URL;

if (!authUrl) {
  console.warn("Neon Auth is not configured. Set VITE_NEON_AUTH_URL.");
}

export const authClient = authUrl ? createAuthClient(authUrl) : null;

// Neon Auth injects the signed JWT into the session returned by getSession().
// Read that session token directly instead of calling a separate JWT endpoint,
// which can return 404 on managed Neon Auth deployments.
export async function getAuthToken() {
  if (!authClient) throw new Error("Authentication is not configured.");

  const result = await authClient.getSession();
  if (result?.error) {
    throw new Error(result.error.message || "Your Neon Auth session could not be retrieved.");
  }

  const session = result?.data?.session ?? result?.session ?? null;
  const token =
    session?.token ||
    session?.access_token ||
    result?.data?.token ||
    result?.token ||
    null;

  if (typeof token !== "string" || !token.trim()) return null;
  return token.trim();
}
