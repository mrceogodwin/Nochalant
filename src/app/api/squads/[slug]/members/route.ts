import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
type Context = { params: Promise<{ slug: string }> };
const roleSchema = z.object({ userId: z.string().cuid(), role: z.enum(["CO_FOUNDER", "MODERATOR", "MEMBER"]) }).strict();

async function getSquad(slug: string) {
  return prisma.squad.findUnique({ where: { slug }, select: { id: true, founderId: true } });
}

export async function GET(_request: NextRequest, context: Context) {
  const actorId = (await auth())?.user?.id;
  if (!actorId) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const { slug } = await context.params;
  const squad = await getSquad(slug);
  if (!squad) return NextResponse.json({ error: "Squad not found." }, { status: 404 });
  const actor = await prisma.squadMember.findUnique({ where: { squadId_userId: { squadId: squad.id, userId: actorId } }, select: { role: true } });
  if (squad.founderId !== actorId && actor?.role !== "CO_FOUNDER" && actor?.role !== "MODERATOR") {
    return NextResponse.json({ error: "Only Squad managers can view membership management." }, { status: 403 });
  }
  const members = await prisma.squadMember.findMany({
    where: { squadId: squad.id }, orderBy: [{ role: "asc" }, { joinedAt: "asc" }],
    take: 100, select: { id: true, role: true, joinedAt: true, user: { select: { id: true, username: true, displayName: true } } },
  });
  return NextResponse.json({ members, canManageRoles: squad.founderId === actorId });
}

export async function PATCH(request: NextRequest, context: Context) {
  const actorId = (await auth())?.user?.id;
  if (!actorId) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const parsed = roleSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Choose a valid member and role." }, { status: 400 });
  const { slug } = await context.params;
  const squad = await getSquad(slug);
  if (!squad) return NextResponse.json({ error: "Squad not found." }, { status: 404 });
  if (squad.founderId !== actorId) return NextResponse.json({ error: "Only the Squad founder can change member roles." }, { status: 403 });
  if (parsed.data.userId === squad.founderId) return NextResponse.json({ error: "The founder role cannot be changed." }, { status: 409 });
  const target = await prisma.squadMember.findUnique({
    where: { squadId_userId: { squadId: squad.id, userId: parsed.data.userId } },
    select: { id: true },
  });
  if (!target) return NextResponse.json({ error: "Squad member not found." }, { status: 404 });
  const updated = await prisma.squadMember.update({
    where: { id: target.id }, data: { role: parsed.data.role }, select: { role: true, userId: true },
  });
  return NextResponse.json({ member: updated });
}

export async function DELETE(request: NextRequest, context: Context) {
  const actorId = (await auth())?.user?.id;
  if (!actorId) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const targetId = request.nextUrl.searchParams.get("userId");
  if (!targetId) return NextResponse.json({ error: "Choose a member to remove." }, { status: 400 });
  const { slug } = await context.params;
  const squad = await getSquad(slug);
  if (!squad) return NextResponse.json({ error: "Squad not found." }, { status: 404 });
  if (squad.founderId === targetId) return NextResponse.json({ error: "The founder cannot be removed." }, { status: 409 });
  const actor = await prisma.squadMember.findUnique({ where: { squadId_userId: { squadId: squad.id, userId: actorId } }, select: { role: true } });
  if (squad.founderId !== actorId && actor?.role !== "CO_FOUNDER" && actor?.role !== "MODERATOR") {
    return NextResponse.json({ error: "You cannot remove Squad members." }, { status: 403 });
  }
  if (actor?.role === "MODERATOR") {
    const target = await prisma.squadMember.findUnique({ where: { squadId_userId: { squadId: squad.id, userId: targetId } }, select: { role: true } });
    if (target?.role !== "MEMBER") return NextResponse.json({ error: "Moderators can only remove regular members." }, { status: 403 });
  }
  await prisma.squadMember.deleteMany({ where: { squadId: squad.id, userId: targetId } });
  return NextResponse.json({ removed: true });
}
