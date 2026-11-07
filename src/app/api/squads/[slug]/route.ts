import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
type Context = { params: Promise<{ slug: string }> };
const actionSchema = z.object({ action: z.enum(["JOIN", "LEAVE"]) }).strict();

export async function GET(_request: NextRequest, context: Context) {
  const { slug } = await context.params;
  const session = await auth();
  const userId = session?.user?.id;
  const squad = await prisma.squad.findUnique({
    where: { slug },
    select: {
      id: true, name: true, slug: true, description: true, coverUrl: true,
      isDiscoverable: true, parentSceneId: true, founderId: true, createdAt: true,
      founder: { select: { id: true, username: true, displayName: true, profile: { select: { avatarUrl: true } } } },
      _count: { select: { members: true } },
    },
  });
  if (!squad) return NextResponse.json({ error: "Squad not found." }, { status: 404 });
  const member = userId ? await prisma.squadMember.findUnique({
    where: { squadId_userId: { squadId: squad.id, userId } },
    select: { role: true, joinedAt: true },
  }) : null;
  if (!squad.isDiscoverable && !member && squad.founderId !== userId) {
    return NextResponse.json({ error: "This Squad is private. You need an invitation to view it." }, { status: 403 });
  }
  const members = await prisma.squadMember.findMany({
    where: { squadId: squad.id },
    orderBy: [{ role: "asc" }, { joinedAt: "asc" }],
    take: 50,
    select: { role: true, joinedAt: true, user: { select: { id: true, username: true, displayName: true, profile: { select: { avatarUrl: true } } } } },
  });
  return NextResponse.json({
    squad: { ...squad, membership: member, isFounder: squad.founderId === userId, members },
  });
}

export async function POST(request: NextRequest, context: Context) {
  const userId = (await auth())?.user?.id;
  if (!userId) return NextResponse.json({ error: "Sign in to manage Squad membership." }, { status: 401 });
  const parsed = actionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Choose a valid membership action." }, { status: 400 });
  const { slug } = await context.params;
  const squad = await prisma.squad.findUnique({ where: { slug }, select: { id: true, founderId: true, isDiscoverable: true } });
  if (!squad) return NextResponse.json({ error: "Squad not found." }, { status: 404 });

  if (parsed.data.action === "JOIN") {
    if (!squad.isDiscoverable && squad.founderId !== userId) {
      return NextResponse.json({ error: "This Squad is invite-only." }, { status: 403 });
    }
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { status: true, ageAssurance: { select: { declaredAdult: true } } } });
    if (!user || user.status !== "ACTIVE") return NextResponse.json({ error: "Your account cannot join a Squad right now." }, { status: 403 });
    if (user.ageAssurance?.declaredAdult !== true) return NextResponse.json({ error: "Confirm that you are 18 or older before joining." }, { status: 403 });
    const blocked = await prisma.userBlock.findFirst({ where: { OR: [{ sourceId: userId, targetId: squad.founderId }, { sourceId: squad.founderId, targetId: userId }] }, select: { id: true } });
    if (blocked) return NextResponse.json({ error: "You cannot join this Squad." }, { status: 403 });
    const membership = await prisma.squadMember.upsert({
      where: { squadId_userId: { squadId: squad.id, userId } },
      create: { squadId: squad.id, userId, role: "MEMBER" },
      update: {},
      select: { role: true, joinedAt: true },
    });
    return NextResponse.json({ membership, joined: true });
  }

  if (squad.founderId === userId) return NextResponse.json({ error: "The founder cannot leave their own Squad." }, { status: 409 });
  await prisma.squadMember.deleteMany({ where: { squadId: squad.id, userId } });
  return NextResponse.json({ joined: false });
}
