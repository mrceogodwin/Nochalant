import { NextResponse } from "next/server";
import { requireModerator } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  await requireModerator();
  const [catalogue, recent, earnedCount, revokedCount] = await Promise.all([
    prisma.badgeCatalog.findMany({ where: { active: true }, orderBy: [{ rarity: "asc" }, { name: "asc" }], select: { id: true, name: true, description: true, rarity: true, criteria: true, active: true } }),
    prisma.userBadge.findMany({
      orderBy: { earnedAt: "desc" },
      take: 100,
      select: {
        id: true, earnedAt: true, revokedAt: true, revocationReason: true,
        user: { select: { id: true, username: true, displayName: true, email: true } },
        badge: { select: { id: true, name: true, rarity: true } },
      },
    }),
    prisma.userBadge.count({ where: { revokedAt: null } }),
    prisma.userBadge.count({ where: { revokedAt: { not: null } } }),
  ]);
  return NextResponse.json({ catalogue, recent, earnedCount, revokedCount }, { headers: { "Cache-Control": "private, no-store" } });
}
