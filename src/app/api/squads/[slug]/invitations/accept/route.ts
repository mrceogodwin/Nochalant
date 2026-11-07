import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
type Context = { params: Promise<{ slug: string }> };
const schema = z.object({ token: z.string().min(32).max(256) }).strict();

export async function POST(request: NextRequest, context: Context) {
  const userId = (await auth())?.user?.id;
  if (!userId) return NextResponse.json({ error: "Sign in to accept this invitation." }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "This invitation link is invalid." }, { status: 400 });
  const { slug } = await context.params;
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { status: true, ageAssurance: { select: { declaredAdult: true } } } });
  if (!user || user.status !== "ACTIVE") return NextResponse.json({ error: "Your account cannot join a Squad right now." }, { status: 403 });
  if (user.ageAssurance?.declaredAdult !== true) return NextResponse.json({ error: "Confirm that you are 18 or older before joining." }, { status: 403 });

  const tokenHash = createHash("sha256").update(parsed.data.token).digest("hex");
  const invitation = await prisma.squadInvitation.findUnique({
    where: { tokenHash },
    select: { id: true, squadId: true, inviteeUserId: true, expiresAt: true, acceptedAt: true, revokedAt: true, squad: { select: { slug: true, founderId: true } } },
  });
  if (!invitation || invitation.squad.slug !== slug || invitation.expiresAt <= new Date() || invitation.acceptedAt || invitation.revokedAt) {
    return NextResponse.json({ error: "This invitation has expired or is no longer available." }, { status: 404 });
  }
  if (invitation.inviteeUserId && invitation.inviteeUserId !== userId) {
    return NextResponse.json({ error: "This invitation was issued to another member." }, { status: 403 });
  }
  const blocked = await prisma.userBlock.findFirst({
    where: { OR: [{ sourceId: userId, targetId: invitation.squad.founderId }, { sourceId: invitation.squad.founderId, targetId: userId }] },
    select: { id: true },
  });
  if (blocked) return NextResponse.json({ error: "You cannot join this Squad." }, { status: 403 });

  try {
    await prisma.$transaction(async tx => {
      const claimed = await tx.squadInvitation.updateMany({
        where: { id: invitation.id, acceptedAt: null, revokedAt: null, expiresAt: { gt: new Date() } },
        data: { acceptedAt: new Date(), inviteeUserId: userId },
      });
      if (claimed.count !== 1) throw new Error("INVITATION_CLAIMED");
      await tx.squadMember.upsert({
        where: { squadId_userId: { squadId: invitation.squadId, userId } },
        create: { squadId: invitation.squadId, userId, role: "MEMBER" },
        update: {},
      });
    });
    return NextResponse.json({ joined: true, slug });
  } catch (error) {
    if (error instanceof Error && error.message === "INVITATION_CLAIMED") {
      return NextResponse.json({ error: "This invitation has already been used." }, { status: 409 });
    }
    return NextResponse.json({ error: "We couldn't accept this invitation. Please try again." }, { status: 500 });
  }
}
