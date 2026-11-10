import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { googleConfigured } from "@/lib/auth";

export async function GET(request: Request) {
  const url = new URL(request.url);
  if (!googleConfigured()) {
    return NextResponse.redirect(new URL("/signup?notice=google", url.origin));
  }
  const state = randomBytes(16).toString("hex");
  const jar = await cookies();
  jar.set("nc_google_state", state, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 600 });
  const redirectUri = `${url.origin}/api/auth/google/callback`;
  const auth = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  auth.searchParams.set("client_id", process.env.GOOGLE_CLIENT_ID!);
  auth.searchParams.set("redirect_uri", redirectUri);
  auth.searchParams.set("response_type", "code");
  auth.searchParams.set("scope", "openid email profile");
  auth.searchParams.set("state", state);
  auth.searchParams.set("prompt", "select_account");
  return NextResponse.redirect(auth);
}
