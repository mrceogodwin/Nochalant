import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  await requireAdmin();
  const applications = await prisma.creatorMonetizationApplication.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "asc" }],
    take: 100,
    select: {
      id: true, sceneName: true, requestedFeatures: true, audienceSummary: true,
      status: true, reviewNote: true, reviewedAt: true, createdAt: true,
      applicant: { select: { id: true, username: true, displayName: true, email: true, profile: { select: { reputationXp: true, rankId: true } } } },
    },
  });
  return NextResponse.json({ applications }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function PATCH(request: NextRequest) {
  const admin = await requireAdmin();
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request body." }, { status: 400 }); }
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid review." }, { status: 400 });
  const input = body as Record<string, unknown>;
  const id = typeof input.id === "string" ? input.id : "";
  const status = input.status;
  const nextStatus = status as "APPROVED" | "REJECTED" | "SUSPENDED";
  const reviewNote = typeof input.reviewNote === "string" ? input.reviewNote.trim().slice(0, 1000) : null;
  if (!id || !["APPROVED", "REJECTED", "SUSPENDED"].includes(String(status))) {
    return NextResponse.json({ error: "A valid application ID and review decision are required." }, { status: 400 });
  }

  const existing = await prisma.creatorMonetizationApplication.findUnique({ where: { id }, select: { id: true, status: true, applicantUserId: true } });
  if (!existing) return NextResponse.json({ error: "Application not found." }, { status: 404 });
  if (existing.status === "SUSPENDED" && status === "APPROVED") {
    return NextResponse.json({ error: "Suspended applications require a separate compliance review." }, { status: 409 });
  }

  const updated = await prisma.$transaction(async (tx) => {
    const application = await tx.creatorMonetizationApplication.update({
      where: { id },
      data: { status: nextStatus, reviewedById: admin.id, reviewNote, reviewedAt: new Date() },
      select: { id: true, status: true, reviewNote: true, reviewedAt: true },
    });
    await tx.auditLog.create({
      data: {
        actorId: admin.id,
        action: "CREATOR_MONETISATION_APPLICATION_REVIEWED",
        targetType: "CreatorMonetizationApplication",
        targetId: id,
        metadata: { previousStatus: existing.status, newStatus: nextStatus, applicantUserId: existing.applicantUserId },
      },
    });
    return application;
  });
  return NextResponse.json({ application: updated }, { headers: { "Cache-Control": "private, no-store" } });
}
