import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
const updateSchema = z.object({ notificationIds: z.array(z.string().cuid()).min(1).max(100) }).strict();

export async function GET() {
  const userId = (await auth())?.user?.id;
  if (!userId) return NextResponse.json({ error: "Sign in to view notifications." }, { status: 401 });
  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 50, select: { id: true, type: true, payload: true, readAt: true, createdAt: true } }),
    prisma.notification.count({ where: { userId, readAt: null } }),
  ]);
  return NextResponse.json({ notifications, unreadCount });
}

export async function PATCH(request: NextRequest) {
  const userId = (await auth())?.user?.id;
  if (!userId) return NextResponse.json({ error: "Sign in to update notifications." }, { status: 401 });
  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Choose valid notifications." }, { status: 400 });
  const result = await prisma.notification.updateMany({ where: { id: { in: parsed.data.notificationIds }, userId, readAt: null }, data: { readAt: new Date() } });
  return NextResponse.json({ updated: result.count });
}
