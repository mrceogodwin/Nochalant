import { NextResponse } from "next/server";
import { getCurrentUser, livekitConfigured } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  if (!livekitConfigured()) {
    return NextResponse.json({
      mode: "preview",
      message: "Set LIVEKIT_URL, LIVEKIT_API_KEY and LIVEKIT_API_SECRET to issue room tokens.",
    });
  }
  return NextResponse.json({
    mode: "configured",
    url: process.env.LIVEKIT_URL,
    message: "LiveKit is configured. Token minting belongs in a server SDK call with LIVEKIT_API_KEY and LIVEKIT_API_SECRET.",
  });
}
