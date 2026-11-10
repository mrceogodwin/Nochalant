import { NextResponse } from "next/server";
import { appleConfigured } from "@/lib/auth";

export async function GET(request: Request) {
  const url = new URL(request.url);
  if (!appleConfigured()) return NextResponse.redirect(new URL("/signup?notice=apple", url.origin));
  return NextResponse.redirect(new URL("/signup?notice=apple", url.origin));
}
