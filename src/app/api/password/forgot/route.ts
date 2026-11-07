import { createHash, randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { z } from "zod";

import { enforceAuthRateLimit } from "@/lib/auth/rate-limit";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const schema = z.object({ email: z.string().trim().email().max(254) });
const TOKEN_TTL_MS = 1000 * 60 * 30;

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

const genericResponse = {
  message: "If an eligible account exists, a password reset link will be sent shortly.",
};

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  try {
    const limit = await enforceAuthRateLimit(`password-reset:${request.headers.get("x-real-ip") || "unknown"}`);
    if (!limit.success) {
      return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 });
    }
  } catch {
    return NextResponse.json({ error: "Password recovery is temporarily unavailable." }, { status: 503 });
  }

  const email = parsed.data.email.toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, displayName: true, emailVerifiedAt: true, status: true },
  });

  if (!user || !user.emailVerifiedAt || user.status !== "ACTIVE") {
    return NextResponse.json(genericResponse, { status: 202 });
  }

  const resendKey = process.env.RESEND_API_KEY;
  const emailFrom = process.env.EMAIL_FROM;
  const authUrl = process.env.AUTH_URL;
  if (!resendKey || !emailFrom || !authUrl) {
    return NextResponse.json({ error: "Password recovery is not configured yet." }, { status: 503 });
  }

  let resetUrl: URL;
  try {
    resetUrl = new URL("/reset-password", authUrl);
  } catch {
    return NextResponse.json({ error: "Password recovery is not configured yet." }, { status: 503 });
  }

  const rawToken = randomBytes(32).toString("base64url");
  const tokenHash = sha256(rawToken);
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

  try {
    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
    await prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash, expiresAt },
    });

    resetUrl.searchParams.set("token", rawToken);
    const resend = new Resend(resendKey);
    const result = await resend.emails.send({
      from: emailFrom,
      to: user.email,
      subject: "Reset your Nochalant Club password",
      text: `Hi ${user.displayName},\n\nUse this link to choose a new password:\n${resetUrl.toString()}\n\nThis link expires in 30 minutes. If you did not request this, you can ignore this email.`,
    });

    if (result.error) throw new Error("Reset email delivery failed.");
  } catch {
    await prisma.passwordResetToken.deleteMany({ where: { tokenHash } }).catch(() => undefined);
    return NextResponse.json({ error: "We could not send a reset email. Please try again later." }, { status: 503 });
  }

  return NextResponse.json(genericResponse, { status: 202 });
}
