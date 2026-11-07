import { createHash, randomBytes, randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Resend } from "resend";

import { hashPassword } from "@/lib/auth/password";
import { enforceAuthRateLimit } from "@/lib/auth/rate-limit";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const registrationSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(12).max(128),
  username: z.string().trim().toLowerCase().regex(/^[a-z0-9_]{3,20}$/),
  displayName: z.string().trim().min(2).max(32),
  declaredAdult: z.literal(true),
  interests: z.array(z.string().trim().min(1).max(40)).min(3).max(12),
  identity: z.string().trim().min(2).max(40),
  acceptedTerms: z.literal(true),
});

const POLICY_VERSION = "beta-18plus-v1";
const TERMS_VERSION = "beta-terms-v1";
const PRIVACY_VERSION = "beta-privacy-v1";
const COMMUNITY_GUIDELINES_VERSION = "beta-guidelines-v1";
const TOKEN_TTL_MS = 1000 * 60 * 60 * 24;

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function requestAddress(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return request.headers.get("x-real-ip") || forwarded || "unknown";
}

export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const parsed = registrationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Check your details and try again." },
      { status: 400 },
    );
  }

  const email = parsed.data.email.toLowerCase();

  try {
    const limit = await enforceAuthRateLimit(`register:${requestAddress(request)}`);
    if (!limit.success) {
      return NextResponse.json(
        { error: "Too many attempts. Please try again later." },
        { status: 429 },
      );
    }
  } catch {
    return NextResponse.json(
      { error: "Account registration is temporarily unavailable." },
      { status: 503 },
    );
  }

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { username: parsed.data.username }] },
    select: { id: true },
  });

  if (existing) {
    // Do not disclose whether an email address or username is already registered.
    return NextResponse.json(
      { message: "If the details are available, an email will be sent to continue." },
      { status: 202 },
    );
  }

  const resendKey = process.env.RESEND_API_KEY;
  const emailFrom = process.env.EMAIL_FROM;
  const authUrl = process.env.AUTH_URL;

  if (!resendKey || !emailFrom || !authUrl) {
    return NextResponse.json(
      { error: "Account registration is not configured yet." },
      { status: 503 },
    );
  }

  const rawToken = randomBytes(32).toString("base64url");
  const tokenHash = sha256(rawToken);
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);
  const passwordHash = await hashPassword(parsed.data.password);
  const resend = new Resend(resendKey);
  let verifyUrl: URL;
  try {
    verifyUrl = new URL("/verify-email", authUrl);
  } catch {
    return NextResponse.json(
      { error: "Account registration is not configured yet." },
      { status: 503 },
    );
  }
  verifyUrl.searchParams.set("token", rawToken);

  let userId: string | undefined;

  try {
    const user = await prisma.user.create({
      data: {
        email,
        username: parsed.data.username,
        displayName: parsed.data.displayName,
        passwordHash,
        ageAssurance: {
          create: {
            declaredAdult: true,
            method: "SELF_DECLARATION",
            policyVersion: POLICY_VERSION,
          },
        },
        profile: {
          create: {
            clubId: `NC-${randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase()}`,
            identityIconId: parsed.data.identity,
          },
        },
        interests: {
          create: [...new Set(parsed.data.interests)].map((interest) => ({ interest })),
        },
        emailVerificationTokens: {
          create: { tokenHash, expiresAt },
        },
        termsAcceptances: {
          create: {
            termsVersion: TERMS_VERSION,
            privacyVersion: PRIVACY_VERSION,
            communityGuidelinesVersion: COMMUNITY_GUIDELINES_VERSION,
          },
        },
      },
      select: { id: true, displayName: true },
    });
    userId = user.id;

    const result = await resend.emails.send({
      from: emailFrom,
      to: email,
      subject: "Verify your Nochalant Club email",
      text: `Hi ${user.displayName},\n\nVerify your email to activate your Nochalant Club account:\n${verifyUrl.toString()}\n\nThis link expires in 24 hours. If you did not request this, you can ignore this email.`,
    });

    if (result.error) throw new Error("Verification email delivery failed.");

    return NextResponse.json(
      { message: "If the details are available, a verification email will arrive shortly." },
      { status: 202 },
    );
  } catch {
    if (userId) {
      await prisma.user.delete({ where: { id: userId } }).catch(() => undefined);
    }

    return NextResponse.json(
      { error: "We could not start registration. Please try again later." },
      { status: 503 },
    );
  }
}
