import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { enforceAuthRateLimit } from "@/lib/auth/rate-limit";
import { hashPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const schema = z.object({
  token: z.string().min(32).max(128),
  password: z.string().min(12).max(128),
});
function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Use a valid reset link and a password of at least 12 characters." }, { status: 400 });
  }

  try {
    const limit = await enforceAuthRateLimit(`password-reset-confirm:${request.headers.get("x-real-ip") || "unknown"}`);
    if (!limit.success) {
      return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 });
    }
  } catch {
    return NextResponse.json({ error: "Password recovery is temporarily unavailable." }, { status: 503 });
  }

  const tokenHash = sha256(parsed.data.token);
  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    select: { id: true, userId: true, expiresAt: true, user: { select: { status: true, emailVerifiedAt: true } } },
  });

  if (!record || record.expiresAt <= new Date() || record.user.status !== "ACTIVE" || !record.user.emailVerifiedAt) {
    if (record) {
      await prisma.passwordResetToken.deleteMany({ where: { id: record.id } });
    }
    return NextResponse.json({ error: "This reset link is invalid or has expired. Request a new one." }, { status: 400 });
  }

  const passwordHash = await hashPassword(parsed.data.password);

  try {
    await prisma.$transaction(async (transaction) => {
      const claimed = await transaction.passwordResetToken.deleteMany({
        where: {
          id: record.id,
          tokenHash,
          expiresAt: { gt: new Date() },
        },
      });

      if (claimed.count !== 1) {
        throw new Error("Reset token was already used or expired.");
      }

      await transaction.user.update({
        where: { id: record.userId },
        data: { passwordHash },
      });
      await transaction.passwordResetToken.deleteMany({
        where: { userId: record.userId },
      });
      await transaction.userSession.updateMany({
        where: { userId: record.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    });
  } catch {
    return NextResponse.json({ error: "We could not update your password. Please request a new link." }, { status: 503 });
  }

  return NextResponse.json({ message: "Your password has been updated. Sign in with your new password." });
}
