import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
const schema = z.object({ iconId: z.string().min(1).max(80) });

export async function POST(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "Sign in to update your Club identity." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Choose a valid identity icon." }, { status: 400 });

  const ownership = await prisma.userIcon.findUnique({
    where: { userId_iconId: { userId, iconId: parsed.data.iconId } },
    select: { id: true },
  });
  if (!ownership) return NextResponse.json({ error: "You haven't unlocked this icon yet." }, { status: 403 });

  await prisma.$transaction([
    prisma.userIcon.updateMany({ where: { userId, isPrimary: true }, data: { isPrimary: false } }),
    prisma.userIcon.update({ where: { userId_iconId: { userId, iconId: parsed.data.iconId } }, data: { isPrimary: true } }),
    prisma.userProfile.update({ where: { userId }, data: { identityIconId: parsed.data.iconId } }),
  ]);
  return NextResponse.json({ success: true, iconId: parsed.data.iconId });
}
