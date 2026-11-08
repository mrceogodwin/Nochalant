import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Sign in to view your Club reputation." }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      username: true,
      displayName: true,
      profile: {
        select: {
          clubId: true,
          bio: true,
          identityIconId: true,
        },
      },
      userIcons: {
        where: { isPrimary: true },
        take: 1,
        select: { icon: { select: { id: true, name: true, rarity: true } } },
      },
      sceneMemberships: {
        where: { status: "ACTIVE" },
        select: { id: true },
      },
      squadMemberships: {
        select: { id: true },
      },
      reputationEvents: {
        where: { reversedAt: null },
        select: { points: true },
      },
      userBadges: {
        where: { revokedAt: null },
        orderBy: { earnedAt: "desc" },
        take: 8,
        select: {
          earnedAt: true,
          badge: { select: { id: true, name: true, description: true, rarity: true, artworkPath: true } },
        },
      },
      memberships: {
        where: { status: "ACTIVE" },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { plan: { select: { name: true, code: true } }, renewsAt: true },
      },
    },
  });

  if (!user) return NextResponse.json({ error: "Member account not found." }, { status: 404 });

  const xp = user.reputationEvents.reduce((sum, event) => sum + event.points, 0);
  const ranks = await prisma.rankDefinition.findMany({
    where: { active: true },
    orderBy: { minXp: "asc" },
    select: { id: true, code: true, name: true, minXp: true },
  });
  const rank = [...ranks].reverse().find((item) => xp >= item.minXp) ?? ranks[0] ?? null;
  const nextRank = ranks.find((item) => item.minXp > xp) ?? null;
  const progress = nextRank && rank
    ? Math.max(0, Math.min(100, Math.round(((xp - rank.minXp) / (nextRank.minXp - rank.minXp)) * 100)))
    : 100;

  return NextResponse.json({
    member: {
      username: user.username,
      displayName: user.displayName,
      clubId: user.profile?.clubId ?? null,
      bio: user.profile?.bio ?? null,
      identity: user.userIcons[0]?.icon ?? null,
      xp,
      rank: rank ? { code: rank.code, name: rank.name, minXp: rank.minXp } : null,
      nextRank: nextRank ? { name: nextRank.name, minXp: nextRank.minXp } : null,
      progress,
      scenesCount: user.sceneMemberships.length,
      squadsCount: user.squadMemberships.length,
      badges: user.userBadges.map((item) => ({ ...item.badge, earnedAt: item.earnedAt })),
      membership: user.memberships[0]?.plan ?? { name: "Free", code: "FREE" },
    },
  }, { headers: { "Cache-Control": "private, no-store" } });
}
