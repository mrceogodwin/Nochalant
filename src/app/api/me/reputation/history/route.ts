import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const labels: Record<string, string> = {
  ONBOARDING_COMPLETE: "Completed onboarding",
  JOIN_SCENE: "Joined a Scene",
  CONSTRUCTIVE_POST: "Published a constructive post",
  HELPFUL_REACTION_RECEIVED: "Received a helpful reaction",
  HOST_SUCCESSFUL_EVENT: "Hosted a successful event",
  HELPFUL_MEMBER_RECOGNITION: "Received member recognition",
  ACCEPTED_MUSIC_FEEDBACK: "Submitted accepted music feedback",
};

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "Sign in to view your reputation history." }, { status: 401 });

  const [events, aggregate, profile] = await Promise.all([
    prisma.reputationEvent.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: { id: true, ruleKey: true, points: true, sourceType: true, createdAt: true, reversedAt: true },
    }),
    prisma.reputationEvent.aggregate({ where: { userId, reversedAt: null }, _sum: { points: true }, _count: { _all: true } }),
    prisma.userProfile.findUnique({ where: { userId }, select: { rank: { select: { name: true, minXp: true } } } }),
  ]);
  return NextResponse.json({
    xp: Math.max(0, aggregate._sum.points ?? 0),
    activeEvents: aggregate._count._all,
    rank: profile?.rank ?? null,
    events: events.map((event) => ({
      ...event,
      label: labels[event.ruleKey] ?? "Community contribution",
      status: event.reversedAt ? "REVERSED" : "ACTIVE",
    })),
  }, { headers: { "Cache-Control": "private, no-store" } });
}
