import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const schema = z.object({
  name: z.string().trim().min(3).max(40),
  description: z.string().trim().min(15).max(300),
  discoverable: z.boolean().default(false),
  parentSceneId: z.string().cuid().optional().nullable(),
}).strict();

function slugify(value: string) {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "Sign in to create a Squad." }, { status: 401 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Check the Squad details and try again." }, { status: 400 });
  const base = slugify(parsed.data.name);
  if (!base) return NextResponse.json({ error: "Choose a different Squad name." }, { status: 400 });

  try {
    const squad = await prisma.$transaction(async (tx) => {
      if (parsed.data.parentSceneId) {
        const sceneAccess = await tx.sceneMember.findFirst({
          where: { sceneId: parsed.data.parentSceneId, userId, status: "ACTIVE" },
          select: { id: true },
        });
        if (!sceneAccess) throw new Error("SCENE_ACCESS");
      }
      const count = await tx.squad.count({ where: { founderId: userId } });
      if (count >= 10) throw new Error("SQUAD_LIMIT");
      return tx.squad.create({
        data: {
          founderId: userId,
          name: parsed.data.name,
          slug: `${base}-${crypto.randomUUID().slice(0, 6)}`,
          description: parsed.data.description,
          isDiscoverable: parsed.data.discoverable,
          parentSceneId: parsed.data.parentSceneId || null,
          members: { create: { userId, role: "FOUNDER" } },
        },
        select: { id: true, name: true, slug: true, description: true, isDiscoverable: true, parentSceneId: true, createdAt: true },
      });
    });
    return NextResponse.json({ squad }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "SCENE_ACCESS") {
      return NextResponse.json({ error: "Join the parent Scene before creating a Squad inside it." }, { status: 403 });
    }
    if (error instanceof Error && error.message === "SQUAD_LIMIT") {
      return NextResponse.json({ error: "You have reached the current Squad creation limit." }, { status: 403 });
    }
    return NextResponse.json({ error: "We couldn't create that Squad. Please try again." }, { status: 500 });
  }
}

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;
  const squads = await prisma.squad.findMany({
    where: {
      OR: [
        { isDiscoverable: true },
        ...(userId ? [{ members: { some: { userId } } }] : []),
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 30,
    select: {
      id: true, name: true, slug: true, description: true, coverUrl: true,
      isDiscoverable: true, parentSceneId: true, createdAt: true,
      _count: { select: { members: true } },
    },
  });
  return NextResponse.json({ squads });
}
