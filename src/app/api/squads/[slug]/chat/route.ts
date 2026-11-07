import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
type Context = { params: Promise<{ slug: string }> };
const messageSchema = z.object({ body: z.string().trim().min(1).max(10000), clientMessageId: z.string().min(8).max(128) }).strict();

async function getSquadAccess(slug: string, userId: string) {
  const squad = await prisma.squad.findUnique({ where: { slug }, select: { id: true, founderId: true, isDiscoverable: true } });
  if (!squad) return { error: "Squad not found.", status: 404 as const };
  const member = await prisma.squadMember.findUnique({ where: { squadId_userId: { squadId: squad.id, userId } }, select: { role: true } });
  if (!member && squad.founderId !== userId) return { error: "Join this Squad to access its chat.", status: 403 as const };
  return { squad, member };
}

async function getConversation(squadId: string) {
  let conversation = await prisma.conversation.findFirst({
    where: { squadId, kind: "SQUAD" }, orderBy: { createdAt: "asc" }, select: { id: true },
  });
  if (!conversation) {
    conversation = await prisma.conversation.create({ data: { squadId, kind: "SQUAD" }, select: { id: true } });
    const members = await prisma.squadMember.findMany({ where: { squadId }, select: { userId: true } });
    await prisma.conversationMember.createMany({
      data: members.map(member => ({ conversationId: conversation!.id, userId: member.userId })),
      skipDuplicates: true,
    });
  }
  return conversation;
}

export async function GET(_request: NextRequest, context: Context) {
  const userId = (await auth())?.user?.id;
  if (!userId) return NextResponse.json({ error: "Sign in to view Squad chat." }, { status: 401 });
  const { slug } = await context.params;
  const access = await getSquadAccess(slug, userId);
  if ("error" in access) return NextResponse.json({ error: access.error }, { status: access.status });
  const conversation = await getConversation(access.squad.id);
  await prisma.conversationMember.upsert({
    where: { conversationId_userId: { conversationId: conversation.id, userId } },
    create: { conversationId: conversation.id, userId },
    update: {},
  });
  const blocked = await prisma.userBlock.findMany({
    where: { OR: [{ sourceId: userId }, { targetId: userId }] },
    select: { sourceId: true, targetId: true },
  });
  const blockedIds = blocked.map(item => item.sourceId === userId ? item.targetId : item.sourceId);
  const messages = await prisma.message.findMany({
    where: { conversationId: conversation.id, deletedAt: null, ...(blockedIds.length ? { senderId: { notIn: blockedIds } } : {}) },
    orderBy: { createdAt: "desc" }, take: 50,
    select: { id: true, senderId: true, body: true, kind: true, createdAt: true, editedAt: true, sender: { select: { id: true, username: true, displayName: true, profile: { select: { avatarUrl: true } } } } },
  });
  await prisma.conversationMember.update({
    where: { conversationId_userId: { conversationId: conversation.id, userId } },
    data: { lastReadAt: new Date() },
  });
  return NextResponse.json({ conversationId: conversation.id, messages: messages.reverse() });
}

export async function POST(request: NextRequest, context: Context) {
  const userId = (await auth())?.user?.id;
  if (!userId) return NextResponse.json({ error: "Sign in to send a Squad message." }, { status: 401 });
  const parsed = messageSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Write a message before sending." }, { status: 400 });
  const { slug } = await context.params;
  const access = await getSquadAccess(slug, userId);
  if ("error" in access) return NextResponse.json({ error: access.error, }, { status: access.status });
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { status: true, ageAssurance: { select: { declaredAdult: true } } } });
  if (!user || user.status !== "ACTIVE") return NextResponse.json({ error: "Your account cannot send messages right now." }, { status: 403 });
  if (user.ageAssurance?.declaredAdult !== true) return NextResponse.json({ error: "Confirm that you are 18 or older before messaging." }, { status: 403 });
  const conversation = await getConversation(access.squad.id);
  const existingMember = await prisma.squadMember.findUnique({ where: { squadId_userId: { squadId: access.squad.id, userId } }, select: { id: true } });
  if (!existingMember && access.squad.founderId !== userId) return NextResponse.json({ error: "Only Squad members can message here." }, { status: 403 });
  await prisma.conversationMember.upsert({
    where: { conversationId_userId: { conversationId: conversation.id, userId } },
    create: { conversationId: conversation.id, userId }, update: {},
  });
  const prior = await prisma.message.findUnique({
    where: { senderId_clientMessageId: { senderId: userId, clientMessageId: parsed.data.clientMessageId } },
    select: { id: true, conversationId: true, body: true, createdAt: true, senderId: true },
  });
  if (prior) {
    if (prior.conversationId !== conversation.id) return NextResponse.json({ error: "This message ID was already used." }, { status: 409 });
    return NextResponse.json({ message: prior }, { status: 200 });
  }
  const message = await prisma.message.create({
    data: { conversationId: conversation.id, senderId: userId, clientMessageId: parsed.data.clientMessageId, kind: "TEXT", body: parsed.data.body },
    select: { id: true, body: true, createdAt: true, senderId: true },
  });
  return NextResponse.json({ message }, { status: 201 });
}
