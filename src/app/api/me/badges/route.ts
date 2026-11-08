import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "Sign in to view your badges." }, { status: 401 });

  const [user, scenes, squads, posts, catalogue, ownership] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { profile: { select: { reputationXp: true } } } }),
    prisma.sceneMember.count({ where: { userId, status: "ACTIVE" } }),
    prisma.squadMember.count({ where: { userId } }),
    prisma.clubPost.count({ where: { authorId: userId, status: "PUBLISHED" } }),
    prisma.badgeCatalog.findMany({ where: { active: true }, orderBy: [{ rarity: "asc" }, { name: "asc" }], select: { id: true, name: true, description: true, rarity: true, artworkPath: true, criteria: true } }),
    prisma.userBadge.findMany({ where: { userId }, select: { badgeId: true, earnedAt: true, revokedAt: true, revocationReason: true } }),
  ]);
  if (!user) return NextResponse.json({ error: "Member account not found." }, { status: 404 });

  const metrics = { SCENE_COUNT: scenes, SQUAD_COUNT: squads, POST_COUNT: posts, REPUTATION_XP: user.profile?.reputationXp ?? 0 };
  const owned = new Map(ownership.map(item => [item.badgeId, item]));
  const badges = catalogue.map(badge => {
    const criteria = badge.criteria as { metric?: keyof typeof metrics; threshold?: number };
    const value = criteria.metric ? metrics[criteria.metric] : 0;
    const threshold = typeof criteria.threshold === "number" ? criteria.threshold : null;
    const record = owned.get(badge.id);
    return {
      ...badge,
      earned: Boolean(record && !record.revokedAt),
      revoked: Boolean(record?.revokedAt),
      earnedAt: record?.earnedAt ?? null,
      progress: threshold ? Math.min(100, Math.round((value / threshold) * 100)) : 0,
      progressLabel: threshold && criteria.metric ? `${Math.min(value, threshold).toLocaleString()} / ${threshold.toLocaleString()} ${criteria.metric.toLowerCase().replace("_", " ")}` : "Achievement requirement pending",
    };
  });
  return NextResponse.json({ badges, earnedCount: badges.filter(item => item.earned).length }, { headers: { "Cache-Control": "private, no-store" } });
}
