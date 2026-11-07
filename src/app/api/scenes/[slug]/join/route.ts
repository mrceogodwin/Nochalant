import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(_request: Request, context: { params: Promise<{ slug: string }> }) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "Sign in to join this Scene." }, { status: 401 });

  const member = await prisma.user.findUnique({
    where: { id: userId },
    select: { status: true, ageAssurance: { select: { declaredAdult: true } } },
  });
  if (!member || member.status !== "ACTIVE") {
    return NextResponse.json({ error: "Your account cannot join Scenes right now." }, { status: 403 });
  }
  if (!member.ageAssurance?.declaredAdult) {
    return NextResponse.json({ error: "Complete the 18+ age confirmation before joining a Scene." }, { status: 403 });
  }

  const { slug } = await context.params;
  const scene = await prisma.scene.findFirst({
    where: { slug, active: true },
    select: { id: true, founderId: true, visibility: true },
  });
  if (!scene) return NextResponse.json({ error: "Scene not found." }, { status: 404 });
  if (scene.founderId === userId) {
    return NextResponse.json({ error: "You already own this Scene." }, { status: 409 });
  }
  if (scene.visibility === "UNLISTED") {
    return NextResponse.json({ error: "This Scene is unlisted. You need an invitation to join." }, { status: 403 });
  }
  if (scene.visibility === "PAID") {
    return NextResponse.json({ error: "Paid Scene checkout is not available yet." }, { status: 403 });
  }

  const block = await prisma.userBlock.findFirst({
    where: {
      OR: [
        { sourceId: userId, targetId: scene.founderId },
        { sourceId: scene.founderId, targetId: userId },
      ],
    },
    select: { id: true },
  });
  if (block) return NextResponse.json({ error: "You cannot join this Scene." }, { status: 403 });

  const nextStatus = scene.visibility === "PRIVATE" ? "PENDING" : "ACTIVE";
  try {
    const membership = await prisma.$transaction(async (tx) => {
      const existing = await tx.sceneMember.findUnique({
        where: { sceneId_userId: { sceneId: scene.id, userId } },
        select: { id: true, status: true, role: true, joinedAt: true },
      });
      if (existing && (existing.status === "ACTIVE" || existing.status === "PENDING")) return existing;
      if (existing) {
        return tx.sceneMember.update({
          where: { id: existing.id },
          data: { status: nextStatus, role: "MEMBER", joinedAt: new Date() },
          select: { id: true, status: true, role: true, joinedAt: true },
        });
      }
      return tx.sceneMember.create({
        data: { sceneId: scene.id, userId, status: nextStatus, role: "MEMBER" },
        select: { id: true, status: true, role: true, joinedAt: true },
      });
    });
    const pending = membership.status === "PENDING";
    return NextResponse.json({
      membership: { status: membership.status, role: membership.role, joinedAt: membership.joinedAt },
      message: pending ? "Your request is waiting for Scene approval." : "You joined the Scene.",
    }, { status: pending ? 202 : 200 });
  } catch {
    return NextResponse.json({ error: "We couldn't process your request. Please try again." }, { status: 500 });
  }
}
