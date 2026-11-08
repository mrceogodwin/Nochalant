import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type BadgeMetric = "SCENE_COUNT" | "SQUAD_COUNT" | "POST_COUNT" | "REPUTATION_XP";

type BadgeCriteria = {
  metric?: BadgeMetric;
  threshold?: number;
};

export async function evaluateBadgesForUser(userId: string) {
  const [user, sceneCount, squadCount, postCount, badges] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, profile: { select: { reputationXp: true } } },
    }),
    prisma.sceneMember.count({ where: { userId, status: "ACTIVE" } }),
    prisma.squadMember.count({ where: { userId } }),
    prisma.clubPost.count({ where: { authorId: userId, status: "PUBLISHED" } }),
    prisma.badgeCatalog.findMany({
      where: { active: true },
      select: { id: true, name: true, criteria: true },
    }),
  ]);

  if (!user) return { awarded: [] as string[] };

  const metrics: Record<BadgeMetric, number> = {
    SCENE_COUNT: sceneCount,
    SQUAD_COUNT: squadCount,
    POST_COUNT: postCount,
    REPUTATION_XP: user.profile?.reputationXp ?? 0,
  };
  const awarded: string[] = [];

  for (const badge of badges) {
    const criteria = badge.criteria as BadgeCriteria;
    if (!criteria.metric || typeof criteria.threshold !== "number") continue;
    if (metrics[criteria.metric] < criteria.threshold) continue;

    try {
      const existing = await prisma.userBadge.findUnique({
        where: { userId_badgeId: { userId, badgeId: badge.id } },
        select: { id: true },
      });
      // A revoked badge stays revoked. Moderators must explicitly restore it;
      // routine activity must never silently undo a moderation decision.
      if (existing) continue;

      await prisma.$transaction(async (tx) => {
        const earned = await tx.userBadge.create({
          data: { userId, badgeId: badge.id },
          select: { id: true },
        });
        await tx.auditLog.create({
          data: {
            action: "BADGE_AUTO_AWARDED",
            targetType: "USER_BADGE",
            targetId: earned.id,
            metadata: { userId, badgeId: badge.id, badgeName: badge.name, metric: criteria.metric, value: metrics[criteria.metric], threshold: criteria.threshold },
          },
        });
      });
      awarded.push(badge.name);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") continue;
      throw error;
    }
  }

  return { awarded };
}
