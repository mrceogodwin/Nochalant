import { createHash, randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
type Context = { params: Promise<{ slug: string }> };
const inviteSchema = z.object({ inviteeUserId: z.string().cuid().optional() }).strict();
const managerRoles = ["FOUNDER", "CO_FOUNDER", "MODERATOR"] as const;

export async function GET(_request: NextRequest, context: Context) {
  const userId = (await auth())?.user?.id;
  if (!userId) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const { slug } = await context.params;
  const squad = await prisma.squad.findUnique({ where: { slug }, select: { id: true, founderId: true } });
  if (!squad) return NextResponse.json({ error: "Squad not found." }, { status: 404 });
  const member = await prisma.squadMember.findUnique({ where: { squadId_userId: { squadId: squad.id, userId } }, select: { role: true } });
  if (squad.founderId !== userId && !managerRoles.includes(member?.role as typeof managerRoles[number])) {
    return NextResponse.json({ error: "Only Squad managers can view invitations." }, { status: 403 });
  }
  const invitations = await prisma.squadInvitation.findMany({
    where: { squadId: squad.id, acceptedAt: null, revokedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" }, take: 50,
    select: { id: true, inviteeUserId: true, expiresAt: true, createdAt: true },
  });
  return NextResponse.json({ invitations });
}

export async function POST(request: NextRequest, context: Context) {
  const userId = (await auth())?.user?.id;
  if (!userId) return NextResponse.json({ error: "Sign in to invite members." }, { status: 401 });
  const parsed = inviteSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid invitation details." }, { status: 400 });
  const { slug } = await context.params;
  const squad = await prisma.squad.findUnique({ where: { slug }, select: { id: true, founderId: true } });
  if (!squad) return NextResponse.json({ error: "Squad not found." }, { status: 404 });
  const member = await prisma.squadMember.findUnique({ where: { squadId_userId: { squadId: squad.id, userId } }, select: { role: true } });
  if (squad.founderId !== userId && !managerRoles.includes(member?.role as typeof managerRoles[number])) {
    return NextResponse.json({ error: "Only Squad managers can invite members." }, { status: 403 });
  }
  if (parsed.data.inviteeUserId) {
    const target = await prisma.user.findUnique({ where: { id: parsed.data.inviteeUserId }, select: { id: true, status: true } });
    if (!target || target.status !== "ACTIVE") return NextResponse.json({ error: "That member is unavailable." }, { status: 404 });
    const blocked = await prisma.userBlock.findFirst({ where: { OR: [{ sourceId: userId, targetId: target.id }, { sourceId: target.id, targetId: userId }, { sourceId: squad.founderId, targetId: target.id }, { sourceId: target.id, targetId: squad.founderId }] }, select: { id: true } });
    if (blocked) return NextResponse.json({ error: "You cannot invite this member." }, { status: 403 });
    const existing = await prisma.squadMember.findUnique({ where: { squadId_userId: { squadId: squad.id, userId: target.id } }, select: { id: true } });
    if (existing) return NextResponse.json({ error: "This person is already a Squad member." }, { status: 409 });
  }
  const token = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const invitation = await prisma.squadInvitation.create({
    data: { squadId: squad.id, invitedById: userId, inviteeUserId: parsed.data.inviteeUserId, tokenHash, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
    select: { id: true, expiresAt: true },
  });
  return NextResponse.json({ invitation, inviteUrl: `/squads/${slug}/invite?token=${token}` }, { status: 201 });
}
