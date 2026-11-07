import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type Context = { params: Promise<{ slug: string }> };
const actionSchema = z.object({
  userId: z.string().min(1).max(128),
  action: z.enum(["APPROVE", "REJECT"]),
}).strict();

async function getManager(sceneId: string, userId: string) {
  return prisma.sceneMember.findFirst({
    where: {
      sceneId,
      userId,
      status: "ACTIVE",
      role: { in: ["FOUNDER", "CO_FOUNDER", "CURATOR", "MODERATOR"] },
    },
    select: { role: true },
  });
}

export async function GET(_request: NextRequest, context: Context) {
  const session = await auth();
  const actorId = session?.user?.id;
  if (!actorId) return NextResponse.json({ error: "Sign in to manage Scene members." }, { status: 401 });
  const { slug } = await context.params;
  const scene = await prisma.scene.findFirst({
    where: { slug, active: true },
    select: { id: true, founderId: true },
  });
  if (!scene) return NextResponse.json({ error: "Scene not found." }, { status: 404 });
  const isFounder = scene.founderId === actorId;
  const manager = isFounder ? true : await getManager(scene.id, actorId);
  if (!manager) return NextResponse.json({ error: "You don't have permission to manage this Scene." }, { status: 403 });

  const [pending, activeCount] = await Promise.all([
    prisma.sceneMember.findMany({
      where: { sceneId: scene.id, status: "PENDING" },
      orderBy: { joinedAt: "asc" },
      take: 100,
      select: {
        userId: true, joinedAt: true,
        user: { select: { username: true, displayName: true, profile: { select: { avatarUrl: true } } } },
      },
    }),
    prisma.sceneMember.count({ where: { sceneId: scene.id, status: "ACTIVE" } }),
  ]);
  return NextResponse.json({ pending, activeCount });
}

export async function POST(request: NextRequest, context: Context) {
  const session = await auth();
  const actorId = session?.user?.id;
  if (!actorId) return NextResponse.json({ error: "Sign in to manage Scene members." }, { status: 401 });
  const parsed = actionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Choose a valid member and action." }, { status: 400 });

  const { slug } = await context.params;
  const scene = await prisma.scene.findFirst({
    where: { slug, active: true },
    select: { id: true, founderId: true },
  });
  if (!scene) return NextResponse.json({ error: "Scene not found." }, { status: 404 });
  const isFounder = scene.founderId === actorId;
  const manager = isFounder ? true : await getManager(scene.id, actorId);
  if (!manager) return NextResponse.json({ error: "You don't have permission to manage this Scene." }, { status: 403 });
  if (parsed.data.userId === scene.founderId) return NextResponse.json({ error: "The founder cannot be changed through member requests." }, { status: 400 });

  const pending = await prisma.sceneMember.findUnique({
    where: { sceneId_userId: { sceneId: scene.id, userId: parsed.data.userId } },
    select: { id: true, status: true },
  });
  if (!pending || pending.status !== "PENDING") {
    return NextResponse.json({ error: "This membership request is no longer pending." }, { status: 409 });
  }

  const updated = await prisma.sceneMember.update({
    where: { id: pending.id },
    data: { status: parsed.data.action === "APPROVE" ? "ACTIVE" : "CANCELLED", joinedAt: parsed.data.action === "APPROVE" ? new Date() : undefined },
    select: { status: true, userId: true },
  });
  return NextResponse.json({
    membership: updated,
    message: parsed.data.action === "APPROVE" ? "Member approved." : "Membership request declined.",
  });
}
