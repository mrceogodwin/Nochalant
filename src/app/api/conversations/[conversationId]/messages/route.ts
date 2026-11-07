import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
type Context = { params: Promise<{ conversationId: string }> };
const schema = z.object({ body: z.string().trim().min(1).max(10000), clientMessageId: z.string().min(8).max(128) }).strict();

async function memberAccess(conversationId: string, userId: string) {
  const member = await prisma.conversationMember.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
    select: { id: true },
  });
  return member;
}

export async function GET(_request: NextRequest, context: Context) {
  const userId = (await auth())?.user?.id;
  if (!userId) return NextResponse.json({ error: "Sign in to view messages." }, { status: 401 });
  const { conversationId } = await context.params;
  if (!await memberAccess(conversationId, userId)) return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
  const blocks = await prisma.userBlock.findMany({ where: { OR: [{ sourceId: userId }, { targetId: userId }] }, select: { sourceId: true, targetId: true } });
  const blockedIds = blocks.map(block => block.sourceId === userId ? block.targetId : block.sourceId);
  const messages = await prisma.message.findMany({
    where: { conversationId, deletedAt: null, ...(blockedIds.length ? { senderId: { notIn: blockedIds } } : {}) },
    orderBy: { createdAt: "desc" }, take: 100,
    select: { id: true, senderId: true, body: true, kind: true, createdAt: true, editedAt: true, sender: { select: { id: true, username: true, displayName: true, profile: { select: { avatarUrl: true } } } } },
  });
  await prisma.conversationMember.update({ where: { conversationId_userId: { conversationId, userId } }, data: { lastReadAt: new Date() } });
  return NextResponse.json({ currentUserId: userId, messages: messages.reverse() });
}

export async function POST(request: NextRequest, context: Context) {
  const userId = (await auth())?.user?.id;
  if (!userId) return NextResponse.json({ error: "Sign in to send messages." }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Write a valid message before sending." }, { status: 400 });
  const { conversationId } = await context.params;
  if (!await memberAccess(conversationId, userId)) return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId }, select: { kind: true, members: { select: { userId: true } } },
  });
  if (!conversation || conversation.kind !== "DIRECT") return NextResponse.json({ error: "This endpoint only supports direct conversations." }, { status: 400 });
  const recipientId = conversation.members.find(member => member.userId !== userId)?.userId;
  if (!recipientId) return NextResponse.json({ error: "Conversation recipient not found." }, { status: 404 });
  const blocked = await prisma.userBlock.findFirst({ where: { OR: [{ sourceId: userId, targetId: recipientId }, { sourceId: recipientId, targetId: userId }] }, select: { id: true } });
  if (blocked) return NextResponse.json({ error: "Messaging is unavailable for this conversation." }, { status: 403 });
  const actor = await prisma.user.findUnique({ where: { id: userId }, select: { status: true, ageAssurance: { select: { declaredAdult: true } } } });
  if (!actor || actor.status !== "ACTIVE" || actor.ageAssurance?.declaredAdult !== true) return NextResponse.json({ error: "Your account must be active and age-confirmed to message." }, { status: 403 });
  const prior = await prisma.message.findUnique({ where: { senderId_clientMessageId: { senderId: userId, clientMessageId: parsed.data.clientMessageId } }, select: { id: true, body: true, createdAt: true, senderId: true } });
  if (prior) return NextResponse.json({ message: prior });
  const message = await prisma.message.create({
    data: { conversationId, senderId: userId, clientMessageId: parsed.data.clientMessageId, kind: "TEXT", body: parsed.data.body },
    select: { id: true, body: true, createdAt: true, senderId: true },
  });
  return NextResponse.json({ message }, { status: 201 });
}
