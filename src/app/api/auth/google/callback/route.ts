import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createSession } from "@/lib/auth";
import { getDb, type Row } from "@/lib/db";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const jar = await cookies();
  const state = url.searchParams.get("state");
  const code = url.searchParams.get("code");
  if (!code || !state || state !== jar.get("nc_google_state")?.value) {
    return NextResponse.redirect(new URL("/signup?notice=google", url.origin));
  }
  const redirectUri = `${url.origin}/api/auth/google/callback`;
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID || "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  const token = (await tokenResponse.json()) as { access_token?: string };
  if (!token.access_token) return NextResponse.redirect(new URL("/signup?notice=google", url.origin));
  const profileResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${token.access_token}` },
  });
  const profile = (await profileResponse.json()) as { sub?: string; email?: string; name?: string; picture?: string };
  if (!profile.sub || !profile.email) return NextResponse.redirect(new URL("/signup?notice=google", url.origin));
  const db = getDb();
  const existing = (await db`
    SELECT id, onboarded FROM social.users WHERE google_sub = ${profile.sub} OR email = ${profile.email.toLowerCase()} LIMIT 1
  `) as Row[];
  let userId = existing[0] ? String(existing[0].id) : "";
  let onboarded = existing[0] ? Boolean(existing[0].onboarded) : false;
  if (!userId) {
    const base = profile.email.split("@")[0].toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 16) || "member";
    const username = `${base}${Math.floor(Math.random() * 900 + 100)}`;
    const created = (await db`
      INSERT INTO social.users (email, username, display_name, google_sub, avatar_url, location)
      VALUES (${profile.email.toLowerCase()}, ${username}, ${profile.name || username}, ${profile.sub}, ${profile.picture || null}, 'Nigeria')
      RETURNING id
    `) as Row[];
    userId = String(created[0].id);
    onboarded = false;
  } else {
    await db`UPDATE social.users SET google_sub = ${profile.sub} WHERE id = ${userId} AND google_sub IS NULL`;
  }
  await createSession(userId);
  return NextResponse.redirect(new URL(onboarded ? "/home" : "/onboarding", url.origin));
}
