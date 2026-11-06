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

// Never keep a JWT in memory past its expiry. A cached token can otherwise
// survive a long-open tab and make every protected API request fail with 401.
function isUsableJwt(token, minimumValiditySeconds = 30) {
  if (typeof token !== "string") return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  try {
    const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
    return Number.isFinite(payload.exp)
      && payload.exp > Math.floor(Date.now() / 1000) + minimumValiditySeconds;
  } catch {
    return false;
  }
}

export function rememberAuthSession(result) {
  const token = extractJwt(result);
  if (token && isUsableJwt(token)) activeSessionToken = token;
  else if (token) activeSessionToken = null;
  return result?.data?.user ?? result?.user ?? null;
}

export function clearRememberedAuthSession() {
  activeSessionToken = null;
}

export async function getAuthToken() {
  if (!authClient) throw new Error("Authentication is not configured.");
  if (isUsableJwt(activeSessionToken)) return activeSessionToken;
  activeSessionToken = null;

  const response = await authClient.$fetch("/token", { method: "GET" });
  const token = extractJwt(response);
  if (token && isUsableJwt(token)) {
    activeSessionToken = token;
    return token;
  }
  return null;
}
