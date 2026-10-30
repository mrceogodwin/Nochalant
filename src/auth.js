import { createAuthClient } from "@neondatabase/auth";

const authUrl = import.meta.env.VITE_NEON_AUTH_URL;

if (!authUrl) {
  console.warn("Neon Auth is not configured. Set VITE_NEON_AUTH_URL.");
}

export const authClient = authUrl ? createAuthClient(authUrl) : null;

// Neon Auth returns the short-lived API JWT as part of the SDK session.
// Read it from the supported session shape rather than manually guessing an endpoint.
export async function getAuthToken() {
  if (!authClient) throw new Error("Authentication is not configured.");
  const result = await authClient.getSession();
  if (result?.error) throw new Error(result.error.message || "Your sign-in session could not be checked.");
  const token = result?.data?.session?.access_token;
  if (typeof token !== "string" || !token.trim()) {
    const error = new Error("Please sign in to continue.");
    error.code = "AUTH_SESSION_REQUIRED";
    throw error;
  }
  return token.trim();
}
