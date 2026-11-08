import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FEATURES = new Set(["PAID_SCENE_MEMBERSHIP", "TICKETED_EVENTS", "EXCLUSIVE_CONTENT", "BRAND_PARTNERSHIPS"]);

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "Sign in to view creator earnings." }, { status: 401 });

  const [applications, entries] = await Promise.all([
    prisma.creatorMonetizationApplication.findMany({
      where: { applicantUserId: userId },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, sceneName: true, requestedFeatures: true, status: true, reviewNote: true, reviewedAt: true, createdAt: true },
    }),
    prisma.creatorLedgerEntry.findMany({
      where: { userId, reversedAt: null },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: { id: true, entryType: true, amountKobo: true, currency: true, sourceType: true, sourceId: true, availableAt: true, createdAt: true },
    }),
  ]);

  const now = new Date();
  const availableKobo = entries.filter((entry) => entry.availableAt && entry.availableAt <= now).reduce((sum, entry) => sum + entry.amountKobo, 0n);
  const pendingKobo = entries.filter((entry) => !entry.availableAt || entry.availableAt > now).reduce((sum, entry) => sum + entry.amountKobo, 0n);
  const lifetimeKobo = entries.reduce((sum, entry) => sum + (entry.amountKobo > 0n ? entry.amountKobo : 0n), 0n);

  return NextResponse.json({
    applications,
    wallet: {
      currency: "NGN",
      availableKobo: availableKobo.toString(),
      pendingKobo: pendingKobo.toString(),
      lifetimeCreditsKobo: lifetimeKobo.toString(),
      ledger: entries.map((entry) => ({ ...entry, amountKobo: entry.amountKobo.toString() })),
    },
    monetisationEnabled: applications.some((application) => application.status === "APPROVED"),
    payoutEnabled: false,
  }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "Sign in to apply for creator monetisation." }, { status: 401 });

  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request body." }, { status: 400 }); }
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid application." }, { status: 400 });

  const input = body as Record<string, unknown>;
  const sceneName = typeof input.sceneName === "string" ? input.sceneName.trim().slice(0, 100) : null;
  const audienceSummary = typeof input.audienceSummary === "string" ? input.audienceSummary.trim() : "";
  const requestedFeatures = Array.isArray(input.requestedFeatures)
    ? [...new Set(input.requestedFeatures.filter((feature): feature is string => typeof feature === "string" && FEATURES.has(feature)))]
    : [];

  if (!audienceSummary || audienceSummary.length > 2000 || requestedFeatures.length === 0) {
    return NextResponse.json({ error: "Provide an audience summary and at least one eligible monetisation feature." }, { status: 400 });
  }

  const existing = await prisma.creatorMonetizationApplication.findFirst({
    where: { applicantUserId: userId, status: { in: ["PENDING", "APPROVED"] } },
    select: { id: true, status: true },
  });
  if (existing) return NextResponse.json({ error: "You already have a pending or approved creator application.", application: existing }, { status: 409 });

  const application = await prisma.creatorMonetizationApplication.create({
    data: { applicantUserId: userId, sceneName, audienceSummary, requestedFeatures },
    select: { id: true, sceneName: true, requestedFeatures: true, status: true, createdAt: true },
  });
  return NextResponse.json({ application }, { status: 201, headers: { "Cache-Control": "private, no-store" } });
}
