import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  const db = getDb();
  const rows = await db`SELECT COUNT(*)::int AS users FROM social.users`;
  return NextResponse.json({ ok: true, users: Number(rows[0]?.users ?? 0) });
}
