import { createAuthClient } from "@neondatabase/auth";

// Route browser authentication through Nochalant's own origin. This makes
// Better Auth cookies first-party in Safari/iOS instead of third-party cookies.
const authUrl = typeof window !== "undefined"
  ? new URL("/api/auth", window.location.origin).toString()
  : null;

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

  const response = await authClient.$fetch("/token", { method: "GET" });
  const token = extractJwt(response);
  if (token) {
    activeSessionToken = token;
    return token;
  }
  return null;
}
