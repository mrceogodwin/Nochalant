import { createRemoteJWKSet, jwtVerify } from "jose";
import { neon } from "@neondatabase/serverless";

let remoteKeys;

export async function requireActiveUser(req) {
  const authorization = req.headers.authorization || "";
  if (!authorization.toLowerCase().startsWith("bearer ")) return { error: { status: 401, message: "Sign in to continue." } };
  const jwksUrl = process.env.NEON_AUTH_JWKS_URL;
  const authBaseUrl = process.env.NEON_AUTH_BASE_URL;
  const databaseUrl = process.env.DATABASE_URL_POOLED || process.env.DATABASE_URL;
  if (!jwksUrl || !authBaseUrl || !databaseUrl) return { error: { status: 503, message: "Secure account services are not configured yet." } };
  try {
    remoteKeys ||= createRemoteJWKSet(new URL(jwksUrl));
    const token = authorization.slice(7).trim();
    const issuer = new URL(authBaseUrl).origin;
    const { payload } = await jwtVerify(token, remoteKeys, { issuer });
    if (typeof payload.sub !== "string" || !payload.sub) return { error: { status: 401, message: "Your session is invalid. Please sign in again." } };
    const sql = neon(databaseUrl);
    const displayName = typeof payload.name === "string" && payload.name.trim() ? payload.name.trim().slice(0,120) : (typeof payload.email === "string" ? payload.email.split("@")[0] : "Nochalant member");
    const email = typeof payload.email === "string" ? payload.email.slice(0,254) : null;
    let rows = await sql`SELECT id, auth_user_id, display_name, role, account_status, suspended_until FROM user_profiles WHERE auth_user_id = ${payload.sub} LIMIT 1`;
    let profile = rows[0];
    if (!profile) {
      rows = await sql`INSERT INTO user_profiles (auth_user_id, display_name, email) VALUES (${payload.sub}, ${displayName}, ${email}) ON CONFLICT (auth_user_id) DO UPDATE SET display_name = COALESCE(NULLIF(user_profiles.display_name, ''), EXCLUDED.display_name), email = COALESCE(user_profiles.email, EXCLUDED.email) RETURNING id, auth_user_id, display_name, role, account_status, suspended_until`;
      profile = rows[0];
    }
    const suspensionExpired = profile.account_status === "suspended" && profile.suspended_until && new Date(profile.suspended_until) <= new Date();
    if (profile.account_status === "banned" || (profile.account_status === "suspended" && !suspensionExpired)) return { error: { status: 403, message: "Your account is restricted from posting and reporting." } };
    if (suspensionExpired) {
      await sql`UPDATE user_profiles SET account_status = 'active', suspended_until = NULL WHERE id = ${profile.id}`;
      profile.account_status = "active";
    }
    return { sql, profile };
  } catch (error) {
    console.error("Nochalant auth verification failed:", error?.message || error);
    return { error: { status: 401, message: "Your session could not be verified. Please sign in again." } };
  }
}