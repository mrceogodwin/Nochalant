import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;
  const [icons, owned, user] = await Promise.all([
    prisma.iconCatalog.findMany({
      where: { active: true },
      orderBy: [{ category: "asc" }, { name: "asc" }],
      select: { id: true, name: true, description: true, category: true, rarity: true, unlockCondition: true, svgPath: true },
    }),
    userId ? prisma.userIcon.findMany({
      where: { userId },
      select: { iconId: true, isPrimary: true, unlockedAt: true },
    }) : Promise.resolve([]),
    userId ? prisma.user.findUnique({
      where: { id: userId },
      select: {
        profile: { select: { reputationXp: true } },
        sceneMemberships: { where: { status: "ACTIVE" }, select: { id: true } },
        adminAssignments: { where: { revokedAt: null, role: { in: ["OWNER", "ADMIN"] } }, select: { id: true }, take: 1 },
      },
    }) : Promise.resolve(null),
  ]);
  const ownedById = new Map(owned.map((item) => [item.iconId, item]));
  const xp = user?.profile?.reputationXp ?? 0;
  const sceneCount = user?.sceneMemberships.length ?? 0;
  const isAdmin = (user?.adminAssignments.length ?? 0) > 0;

  const result = icons.map((icon) => {
    const condition = icon.unlockCondition as { type?: string; minXp?: number; minCount?: number };
    let unlockable = false;
    let unlockLabel = "Sign in to see your progress";
    if (userId && condition.type === "REPUTATION_XP") {
      const required = condition.minXp ?? Number.MAX_SAFE_INTEGER;
      unlockable = xp >= required;
      unlockLabel = unlockable ? "Ready to unlock" : `${Math.max(0, required - xp).toLocaleString()} XP needed`;
    } else if (userId && condition.type === "SCENE_COUNT") {
      const required = condition.minCount ?? Number.MAX_SAFE_INTEGER;
      unlockable = sceneCount >= required;
      unlockLabel = unlockable ? "Ready to unlock" : `${Math.max(0, required - sceneCount)} more Scenes needed`;
    } else if (userId && condition.type === "ADMIN_ONLY") {
      unlockable = isAdmin;
      unlockLabel = isAdmin ? "Admin unlock available" : "Founders / admin release";
    } else if (userId && condition.type === "STARTER") {
      unlockable = true;
      unlockLabel = "Starter identity";
    }
    const ownership = ownedById.get(icon.id);
    return {
      id: icon.id,
      name: icon.name,
      description: icon.description,
      category: icon.category,
      rarity: icon.rarity,
      svgPath: icon.svgPath,
      owned: Boolean(ownership),
      selected: ownership?.isPrimary ?? false,
      unlockable: !ownership && unlockable,
      unlockLabel: ownership ? "Unlocked" : unlockLabel,
    };
  });

  return NextResponse.json({ icons: result, total: result.length }, {
    headers: { "Cache-Control": "private, no-store" },
  });
}
