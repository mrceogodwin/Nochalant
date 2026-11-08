import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * Reputation can only be awarded by trusted server-side feature handlers.
 * Never expose this function through a client-controlled XP endpoint.
 */
export const REPUTATION_RULES = {
  ONBOARDING_COMPLETE: { points: 25, dailyLimit: 1 },
  JOIN_SCENE: { points: 10, dailyLimit: 3 },
  CONSTRUCTIVE_POST: { points: 5, dailyLimit: 5 },
  HELPFUL_REACTION_RECEIVED: { points: 2, dailyLimit: 10 },
  HOST_SUCCESSFUL_EVENT: { points: 20, dailyLimit: 2 },
  HELPFUL_MEMBER_RECOGNITION: { points: 5, dailyLimit: 5 },
  ACCEPTED_MUSIC_FEEDBACK: { points: 5, dailyLimit: 5 },
} as const;

export type ReputationRuleKey = keyof typeof REPUTATION_RULES;

const DAILY_XP_LIMIT = 100;

function lagosDayBounds(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Lagos",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const day = `${values.year}-${values.month}-${values.day}`;
  const start = new Date(`${day}T00:00:00+01:00`);
  return { start, end: new Date(start.getTime() + 24 * 60 * 60 * 1000) };
}

async function refreshProfileRank(tx: Prisma.TransactionClient, userId: string) {
  const [total, ranks] = await Promise.all([
    tx.reputationEvent.aggregate({
      where: { userId, reversedAt: null },
      _sum: { points: true },
    }),
    tx.rankDefinition.findMany({
      where: { active: true },
      orderBy: { minXp: "asc" },
      select: { id: true, name: true, minXp: true },
    }),
  ]);
  const xp = Math.max(0, total._sum.points ?? 0);
  const rank = [...ranks].reverse().find((item) => xp >= item.minXp) ?? null;
  await tx.userProfile.updateMany({
    where: { userId },
    data: { reputationXp: xp, rankId: rank?.id ?? null },
  });
  return { xp, rank };
}

export async function awardReputation(input: {
  userId: string;
  ruleKey: ReputationRuleKey;
  idempotencyKey: string;
  sourceType: string;
  sourceId?: string;
}) {
  const rule = REPUTATION_RULES[input.ruleKey];
  if (!rule) throw new Error("Unsupported reputation rule.");
  if (!input.idempotencyKey.trim() || input.idempotencyKey.length > 190) {
    throw new Error("A valid idempotency key is required.");
  }

  try {
    return await prisma.$transaction(async (tx) => {
      const existing = await tx.reputationEvent.findUnique({
        where: { idempotencyKey: input.idempotencyKey },
        select: { id: true, points: true },
      });
      if (existing) return { awarded: false as const, reason: "DUPLICATE", xpAwarded: 0 };

      const { start, end } = lagosDayBounds();
      const dailyWhere = { userId: input.userId, reversedAt: null, createdAt: { gte: start, lt: end } };
      const [daily, sameRuleCount] = await Promise.all([
        tx.reputationEvent.aggregate({ where: dailyWhere, _sum: { points: true } }),
        tx.reputationEvent.count({ where: { ...dailyWhere, ruleKey: input.ruleKey } }),
      ]);
      if (sameRuleCount >= rule.dailyLimit) {
        return { awarded: false as const, reason: "RULE_DAILY_LIMIT", xpAwarded: 0 };
      }
      if ((daily._sum.points ?? 0) + rule.points > DAILY_XP_LIMIT) {
        return { awarded: false as const, reason: "DAILY_XP_LIMIT", xpAwarded: 0 };
      }

      await tx.reputationEvent.create({
        data: {
          userId: input.userId,
          ruleKey: input.ruleKey,
          points: rule.points,
          idempotencyKey: input.idempotencyKey,
          sourceType: input.sourceType,
          sourceId: input.sourceId,
        },
      });
      const profile = await refreshProfileRank(tx, input.userId);
      return { awarded: true as const, reason: "AWARDED", xpAwarded: rule.points, ...profile };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  } catch (error) {
    // A concurrent retry with the same idempotency key is a harmless duplicate.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { awarded: false as const, reason: "DUPLICATE", xpAwarded: 0 };
    }
    throw error;
  }
}

export async function reverseReputation(eventId: string) {
  return prisma.$transaction(async (tx) => {
    const event = await tx.reputationEvent.findUnique({
      where: { id: eventId },
      select: { id: true, userId: true, reversedAt: true },
    });
    if (!event) return { reversed: false as const, reason: "NOT_FOUND" };
    if (event.reversedAt) return { reversed: false as const, reason: "ALREADY_REVERSED" };

    await tx.reputationEvent.update({
      where: { id: event.id },
      data: { reversedAt: new Date() },
    });
    const profile = await refreshProfileRank(tx, event.userId);
    return { reversed: true as const, ...profile };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}
