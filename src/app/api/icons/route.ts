import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;
  const [icons, owned] = await Promise.all([
    prisma.iconCatalog.findMany({
      where: { active: true },
      orderBy: [{ category: "asc" }, { name: "asc" }],
      select: { id: true, name: true, description: true, category: true, rarity: true, unlockCondition: true, svgPath: true },
    }),
    userId ? prisma.userIcon.findMany({
      where: { userId },
      select: { iconId: true, isPrimary: true, unlockedAt: true },
    }) : Promise.resolve([]),
  ]);
  const ownedById = new Map(owned.map((item) => [item.iconId, item]));
  return NextResponse.json({
    icons: icons.map((icon) => ({
      ...icon,
      owned: ownedById.has(icon.id),
      selected: ownedById.get(icon.id)?.isPrimary ?? false,
    })),
    total: icons.length,
  }, { headers: { "Cache-Control": "private, no-store" } });
}
