import { createRemoteJWKSet, jwtVerify } from "jose";
import { neon } from "@neondatabase/serverless";

let remoteKeys;

export async function requireActiveUser(req) {
  const authorization = req.headers.authorization || "";
  if (!authorization.toLowerCase().startsWith("bearer ")) {
    return { error: { status: 401, message: "Sign in to continue." } };
  }
  const jwksUrl = process.env.NEON_AUTH_JWKS_URL;
  const issuer = process.env.NEON_AUTH_BASE_URL;
  const databaseUrl = process.env.DATABASE_URL_POOLED || process.env.DATABASE_URL;
  if (!jwksUrl || !issuer || !databaseUrl) {
    return { error: { status: 503, message: "Secure account services are not configured yet." } };
  }
  try {
    remoteKeys ||= createRemoteJWKSet(new URL(jwksUrl));
    const token = authorization.slice(7).trim();
    const { payload } = await jwtVerify(token, remoteKeys, { issuer: new URL(issuer).origin });
    if (typeof payload.sub !== "string" || !payload.sub) {
      return { error: { status: 401, message: "Your session is invalid. Please sign in again." } };
    }
    const sql = neon(databaseUrl);
    const rows = await sql`
      SELECT id, auth_user_id, display_name, role, account_status, suspended_until
      FROM user_profiles
      WHERE auth_user_id = ${payload.sub}
      LIMIT 1
    `;
    const profile = rows[0];
    if (!profile) return { error: { status: 403, message: "Your account profile is not ready. Please contact support." } };
    const suspensionExpired = profile.account_status === "suspended" && profile.suspended_until && new Date(profile.suspended_until) <= new Date();
    if (profile.account_status === "banned" || (profile.account_status === "suspended" && !suspensionExpired)) {
      return { error: { status: 403, message: "Your account is restricted from posting and reporting." } };
    }
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
