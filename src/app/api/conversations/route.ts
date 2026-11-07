import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
const createSchema = z.object({ recipientUserId: z.string().cuid() }).strict();

export async function GET() {
  const userId = (await auth())?.user?.id;
  if (!userId) return NextResponse.json({ error: "Sign in to view your conversations." }, { status: 401 });
  const memberships = await prisma.conversationMember.findMany({
    where: { userId, conversation: { kind: "DIRECT" } },
    orderBy: { joinedAt: "desc" }, take: 100,
    select: { conversationId: true, lastReadAt: true, mutedAt: true, conversation: { select: {
      id: true, createdAt: true,
      members: { where: { userId: { not: userId } }, take: 1, select: { userId: true, user: { select: { id: true, username: true, displayName: true, profile: { select: { avatarUrl: true } } } } } },
      messages: { where: { deletedAt: null }, orderBy: { createdAt: "desc" }, take: 1, select: { body: true, createdAt: true, senderId: true } },
    } } },
  });
  const items = memberships.flatMap(item => {
    const peer = item.conversation.members[0]?.user;
    if (!peer) return [];
    const latest = item.conversation.messages[0] || null;
    return [{ id: item.conversationId, peer, lastMessage: latest, lastReadAt: item.lastReadAt, mutedAt: item.mutedAt }];
  });
  return NextResponse.json({ conversations: items });
}

export async function POST(request: NextRequest) {
  const userId = (await auth())?.user?.id;
  if (!userId) return NextResponse.json({ error: "Sign in to start a conversation." }, { status: 401 });
  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || parsed.data.recipientUserId === userId) return NextResponse.json({ error: "Choose another member to message." }, { status: 400 });
  const [actor, recipient] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { status: true, ageAssurance: { select: { declaredAdult: true } } } }),
    prisma.user.findUnique({ where: { id: parsed.data.recipientUserId }, select: { id: true, status: true } }),
  ]);
  if (!actor || actor.status !== "ACTIVE" || actor.ageAssurance?.declaredAdult !== true) return NextResponse.json({ error: "Your account must be active and age-confirmed to message." }, { status: 403 });
  if (!recipient || recipient.status !== "ACTIVE") return NextResponse.json({ error: "This member is unavailable." }, { status: 404 });
  const block = await prisma.userBlock.findFirst({ where: { OR: [{ sourceId: userId, targetId: recipient.id }, { sourceId: recipient.id, targetId: userId }] }, select: { id: true } });
  if (block) return NextResponse.json({ error: "You cannot start a conversation with this member." }, { status: 403 });
  const existing = await prisma.conversation.findFirst({
    where: { kind: "DIRECT", members: { some: { userId } }, AND: [{ members: { some: { userId: recipient.id } } }] },
    select: { id: true },
  });
  if (existing) return NextResponse.json({ conversationId: existing.id, existing: true });
  const conversation = await prisma.conversation.create({
    data: { kind: "DIRECT", members: { create: [{ userId }, { userId: recipient.id }] } },
    select: { id: true },
  });
  return NextResponse.json({ conversationId: conversation.id, existing: false }, { status: 201 });
}
