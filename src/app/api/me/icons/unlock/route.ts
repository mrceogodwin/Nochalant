import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
const schema = z.object({ iconId: z.string().min(1).max(80) }).strict();

export async function POST(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "Sign in to unlock an identity." }, { status: 401 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Choose a valid identity." }, { status: 400 });

  const [user, icon, existing] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        status: true,
        profile: { select: { reputationXp: true } },
        sceneMemberships: { where: { status: "ACTIVE" }, select: { id: true } },
        adminAssignments: { where: { revokedAt: null, role: { in: ["OWNER", "ADMIN"] } }, select: { id: true }, take: 1 },
      },
    }),
    prisma.iconCatalog.findFirst({
      where: { id: parsed.data.iconId, active: true },
      select: { id: true, unlockCondition: true },
    }),
    prisma.userIcon.findUnique({
      where: { userId_iconId: { userId, iconId: parsed.data.iconId } },
      select: { id: true },
    }),
  ]);

  if (!user || user.status !== "ACTIVE") return NextResponse.json({ error: "Your account cannot unlock identities right now." }, { status: 403 });
  if (!icon) return NextResponse.json({ error: "This identity is not available." }, { status: 404 });
  if (existing) return NextResponse.json({ success: true, alreadyOwned: true });

  const condition = icon.unlockCondition as { type?: string; minXp?: number; minCount?: number };
  let eligible = false;
  if (condition.type === "REPUTATION_XP") {
    eligible = (user.profile?.reputationXp ?? 0) >= (condition.minXp ?? Number.MAX_SAFE_INTEGER);
  } else if (condition.type === "SCENE_COUNT") {
    eligible = user.sceneMemberships.length >= (condition.minCount ?? Number.MAX_SAFE_INTEGER);
  } else if (condition.type === "ADMIN_ONLY") {
    eligible = user.adminAssignments.length > 0;
  } else if (condition.type === "STARTER") {
    eligible = true;
  }

  if (!eligible) return NextResponse.json({ error: "You haven't met this identity's unlock requirement yet." }, { status: 403 });

  try {
    await prisma.userIcon.create({ data: { userId, iconId: icon.id } });
  } catch (error) {
    if (!(error instanceof Error) || !("code" in error) || error.code !== "P2002") throw error;
  }
  return NextResponse.json({ success: true, iconId: icon.id });
}
