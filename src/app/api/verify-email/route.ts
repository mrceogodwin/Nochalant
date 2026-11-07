import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export async function GET(request: NextRequest) {
  const rawToken = request.nextUrl.searchParams.get("token");

  if (!rawToken || rawToken.length > 128) {
    return NextResponse.redirect(new URL("/sign-in?verification=invalid", request.url));
  }

  const tokenHash = sha256(rawToken);
  const record = await prisma.emailVerificationToken.findUnique({
    where: { tokenHash },
    select: { id: true, userId: true, expiresAt: true, user: { select: { emailVerifiedAt: true } } },
  });

  if (!record || record.expiresAt <= new Date()) {
    if (record) {
      await prisma.emailVerificationToken.deleteMany({ where: { id: record.id } });
    }
    return NextResponse.redirect(new URL("/sign-in?verification=expired", request.url));
  }

  if (record.user.emailVerifiedAt) {
    await prisma.emailVerificationToken.deleteMany({ where: { userId: record.userId } });
    return NextResponse.redirect(new URL("/sign-in?verification=complete", request.url));
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { emailVerifiedAt: new Date() },
    }),
    prisma.emailVerificationToken.deleteMany({
      where: { userId: record.userId },
    }),
  ]);

  return NextResponse.redirect(new URL("/sign-in?verification=complete", request.url));
}
