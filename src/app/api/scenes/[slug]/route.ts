import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type Context = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, context: Context) {
  const { slug } = await context.params;
  const session = await auth();
  const userId = session?.user?.id;

  const scene = await prisma.scene.findFirst({
    where: { slug, active: true },
    select: {
      id: true, name: true, slug: true, description: true, category: true,
      coverUrl: true, visibility: true, rules: true, founderId: true, createdAt: true,
      _count: { select: { members: { where: { status: "ACTIVE" } } } },
      members: userId ? {
        where: { userId },
        take: 1,
        select: { status: true, role: true, joinedAt: true },
      } : false,
      channels: {
        where: { archivedAt: null },
        orderBy: [{ isDefault: "desc" }, { name: "asc" }],
        select: { id: true, name: true, slug: true, description: true, isDefault: true },
      },
    },
  });

  if (!scene) return NextResponse.json({ error: "Scene not found." }, { status: 404 });
  const membership = scene.members[0] ?? null;
  const isFounder = scene.founderId === userId;
  const isActiveMember = membership?.status === "ACTIVE";
  if (scene.visibility === "UNLISTED" && !isFounder && !membership) {
    return NextResponse.json({ error: "This Scene is unlisted. You need an invitation." }, { status: 404 });
  }
  if (scene.visibility === "PRIVATE" && !isFounder && !isActiveMember) {
    return NextResponse.json({
      scene: {
        id: scene.id, name: scene.name, slug: scene.slug, description: scene.description,
        category: scene.category, coverUrl: scene.coverUrl, visibility: scene.visibility,
        memberCount: scene._count.members, createdAt: scene.createdAt,
      },
      membership: membership ? { status: membership.status, role: membership.role } : null,
      access: "RESTRICTED",
    });
  }
  return NextResponse.json({
    scene: {
      id: scene.id, name: scene.name, slug: scene.slug, description: scene.description,
      category: scene.category, coverUrl: scene.coverUrl, visibility: scene.visibility,
      rules: scene.rules, memberCount: scene._count.members, createdAt: scene.createdAt,
      channels: scene.channels,
    },
    membership: membership ? { status: membership.status, role: membership.role, joinedAt: membership.joinedAt } : null,
    access: isFounder || isActiveMember ? "MEMBER" : "PUBLIC",
  });
}

export async function DELETE(_request: Request, context: Context) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "Sign in to leave this Scene." }, { status: 401 });
  const { slug } = await context.params;
  const scene = await prisma.scene.findFirst({
    where: { slug, active: true },
    select: { id: true, founderId: true },
  });
  if (!scene) return NextResponse.json({ error: "Scene not found." }, { status: 404 });
  if (scene.founderId === userId) {
    return NextResponse.json({ error: "The founder cannot leave their own Scene. Transfer ownership or deactivate it instead." }, { status: 403 });
  }
  const result = await prisma.sceneMember.updateMany({
    where: { sceneId: scene.id, userId, status: { in: ["ACTIVE", "PENDING"] } },
    data: { status: "CANCELLED" },
  });
  if (!result.count) return NextResponse.json({ error: "You are not an active member or pending applicant." }, { status: 404 });
  return NextResponse.json({ message: "You have left the Scene." });
}
