import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(_request: Request, context: { params: Promise<{ slug: string }> }) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "Sign in to join this Scene." }, { status: 401 });

  const { slug } = await context.params;
  const scene = await prisma.scene.findFirst({
    where: { slug, active: true },
    select: { id: true, visibility: true },
  });
  if (!scene) return NextResponse.json({ error: "Scene not found." }, { status: 404 });
  if (scene.visibility === "UNLISTED") {
    return NextResponse.json({ error: "This Scene is unlisted. You need an invitation to join." }, { status: 403 });
  }
  if (scene.visibility === "PAID") {
    return NextResponse.json({ error: "Paid Scene access is not enabled yet." }, { status: 403 });
  }

  const status = scene.visibility === "PRIVATE" ? "PENDING" : "ACTIVE";
  try {
    const membership = await prisma.sceneMember.upsert({
      where: { sceneId_userId: { sceneId: scene.id, userId } },
      create: { sceneId: scene.id, userId, status, role: "MEMBER" },
      update: {},
      select: { status: true, joinedAt: true },
    });
    return NextResponse.json({
      membership,
      message: membership.status === "PENDING" ? "Your request has been sent to the Scene moderators." : "You joined the Scene.",
    }, { status: membership.status === "PENDING" ? 202 : 200 });
  } catch {
    return NextResponse.json({ error: "We couldn't process your request. Please try again." }, { status: 500 });
  }
}
