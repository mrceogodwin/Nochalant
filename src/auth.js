import { createAuthClient } from "@neondatabase/auth";

const authUrl = import.meta.env.VITE_NEON_AUTH_URL;

if (!authUrl) {
  console.warn("Neon Auth is not configured. Set VITE_NEON_AUTH_URL.");
}

export const authClient = authUrl ? createAuthClient(authUrl) : null;

// Use Neon Auth's documented JWT helper. getSession() exposes session metadata,
// but the bearer JWT is retrieved separately by the SDK.
export async function getAuthToken() {
  if (!authClient) throw new Error("Authentication is not configured.");
  let result;
  if (typeof authClient.getJWTToken === "function") {
    result = await authClient.getJWTToken();
  } else if (typeof authClient.token === "function") {
    result = await authClient.token();
  } else {
    throw new Error("This Neon Auth SDK version does not expose a JWT token method. Please update the authentication package.");
  }
  if (result?.error) throw new Error(result.error.message || "Your sign-in token could not be retrieved.");
  const token = typeof result === "string"
    ? result
    : result?.data?.token || result?.token || result?.data?.access_token || result?.data?.session?.access_token;
  if (typeof token !== "string" || !token.trim()) {
    const error = new Error("Neon Auth did not return a signed-in JWT. Please sign in again.");
    error.code = "AUTH_SESSION_REQUIRED";
    throw error;
  }
  return token.trim();
}
