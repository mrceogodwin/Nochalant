import { createAuthClient } from "@neondatabase/auth";

const authUrl = import.meta.env.VITE_NEON_AUTH_URL;

if (!authUrl) {
  console.warn("Neon Auth is not configured. Set VITE_NEON_AUTH_URL.");
}

export const authClient = authUrl ? createAuthClient(authUrl) : null;
let activeSessionToken = null;

function extractJwt(result) {
  const candidates = [
    result?.data?.token,
    result?.token,
    result?.data?.session?.token,
    result?.session?.token,
  ];
  return candidates.find(value =>
    typeof value === "string" &&
    value.split(".").length === 3 &&
    value.trim().length > 40
  )?.trim() ?? null;
}

export function rememberAuthSession(result) {
  const token = extractJwt(result);
  if (token) activeSessionToken = token;
  return result?.data?.user ?? result?.user ?? null;
}

export function clearRememberedAuthSession() {
  activeSessionToken = null;
}

export async function getAuthToken() {
  if (!authClient) throw new Error("Authentication is not configured.");
  if (activeSessionToken) return activeSessionToken;

  // Better Auth's JWT plugin exposes a dedicated GET /token endpoint. This
  // returns { token }, unlike the session endpoint's cookie/session metadata.
  if (typeof authClient.$fetch === "function") {
    const response = await authClient.$fetch("/token", { method: "GET" });
    const token = extractJwt(response);
    if (token) {
      activeSessionToken = token;
      return token;
    }
  }

  // Fallback for SDK versions that inject set-auth-jwt into getSession().
  const result = await authClient.getSession();
  if (result?.error) {
    throw new Error(result.error.message || "Your Neon Auth session could not be retrieved.");
  }
  const token = extractJwt(result);
  if (token) {
    activeSessionToken = token;
    return token;
  }
  return null;
}
