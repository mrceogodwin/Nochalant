import { NextResponse } from "next/server";
import { z } from "zod";
import { requireModerator } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
const schema = z.object({ reason: z.string().trim().min(8).max(500) }).strict();

export async function POST(request: Request, context: { params: Promise<{ userBadgeId: string }> }) {
  const moderator = await requireModerator();
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Provide a clear moderation reason (8–500 characters)." }, { status: 400 });

  const { userBadgeId } = await context.params;
  const record = await prisma.userBadge.findUnique({
    where: { id: userBadgeId },
    select: {
      id: true, userId: true, badgeId: true, revokedAt: true,
      user: { select: { username: true } },
      badge: { select: { name: true } },
    },
  });
  if (!record) return NextResponse.json({ error: "Badge award not found." }, { status: 404 });
  if (record.revokedAt) return NextResponse.json({ error: "This badge has already been revoked." }, { status: 409 });

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.userBadge.updateMany({
      where: { id: record.id, revokedAt: null },
      data: { revokedAt: new Date(), revokedById: moderator.id, revocationReason: parsed.data.reason },
    });
    if (updated.count !== 1) return false;
    await tx.auditLog.create({
      data: {
        actorId: moderator.id,
        action: "BADGE_REVOKED",
        targetType: "USER_BADGE",
        targetId: record.id,
        metadata: {
          userId: record.userId,
          username: record.user.username,
          badgeId: record.badgeId,
          badgeName: record.badge.name,
          reason: parsed.data.reason,
          staffRole: moderator.role,
        },
      },
    });
    return true;
  });

  if (!result) return NextResponse.json({ error: "This badge was changed by another moderator. Refresh and try again." }, { status: 409 });
  return NextResponse.json({ success: true, revokedBadgeId: record.id });
}
