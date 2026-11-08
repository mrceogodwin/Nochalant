import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const totals = await prisma.reputationEvent.groupBy({
    by: ["userId"],
    where: { reversedAt: null },
    _sum: { points: true },
    orderBy: { _sum: { points: "desc" } },
    take: 100,
  });
  const [users, ranks] = await Promise.all([prisma.user.findMany({
    where: {
      id: { in: totals.map((item) => item.userId) },
      status: "ACTIVE",
      profile: { is: { isDiscoverable: true } },
    },
    select: {
      id: true, username: true, displayName: true,
      profile: { select: { reputationXp: true, rankId: true, identityIconId: true } },
      userIcons: { where: { isPrimary: true }, take: 1, select: { icon: { select: { name: true } } } },
    },
  }), prisma.rankDefinition.findMany({ where: { active: true }, select: { id: true, name: true } })]);
  const rankById = new Map(ranks.map((rank) => [rank.id, rank.name]));
  const byId = new Map(users.map((user) => [user.id, user]));
  const rows = totals.flatMap((total) => {
    const user = byId.get(total.userId);
    if (!user) return [];
    return [{
      userId: user.id,
      username: user.username,
      displayName: user.displayName,
      xp: Math.max(0, total._sum.points ?? 0),
      rank: user.profile?.rankId ? rankById.get(user.profile.rankId) ?? "New Face" : "New Face",
      identity: user.userIcons[0]?.icon.name ?? null,
    }];
  }).sort((a, b) => b.xp - a.xp).slice(0, 50)
    .map((item, index) => ({ position: index + 1, ...item, userId: undefined }));
  return NextResponse.json({ leaderboard: rows, updatedAt: new Date().toISOString() }, {
    headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" },
  });
}
