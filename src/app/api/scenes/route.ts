import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const schema = z.object({
  name: z.string().trim().min(3).max(48),
  description: z.string().trim().min(15).max(500),
  category: z.string().trim().min(2).max(32),
  visibility: z.enum(["PUBLIC", "PRIVATE", "PAID", "UNLISTED"]),
  rules: z.array(z.string().trim().min(3).max(240)).max(12).default([]),
}).strict();

function slugify(value: string) {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "Sign in to create a Scene." }, { status: 401 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Check the Scene details and try again." }, { status: 400 });

  const base = slugify(parsed.data.name);
  if (!base) return NextResponse.json({ error: "Choose a different Scene name." }, { status: 400 });

  try {
    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.scene.findFirst({ where: { founderId: userId }, select: { id: true }, take: 10 });
      if (existing && (await tx.scene.count({ where: { founderId: userId, active: true } })) >= 5) {
        throw new Error("SCENE_LIMIT");
      }
      const slug = `${base}-${crypto.randomUUID().slice(0, 6)}`;
      const scene = await tx.scene.create({
        data: {
          founderId: userId,
          name: parsed.data.name,
          slug,
          description: parsed.data.description,
          category: parsed.data.category,
          visibility: parsed.data.visibility,
          rules: parsed.data.rules.length ? parsed.data.rules : [
            "Respect every member and their boundaries.",
            "No harassment, hate or targeted abuse.",
            "Respect creators and share responsibly.",
            "Report harmful content to moderators.",
          ],
          members: { create: { userId, role: "FOUNDER", status: "ACTIVE" } },
          channels: { create: { name: "General", slug: "general", description: "The main conversation", isDefault: true } },
        },
        select: { id: true, name: true, slug: true, visibility: true, category: true, createdAt: true },
      });
      return scene;
    });
    return NextResponse.json({ scene: result }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "SCENE_LIMIT") {
      return NextResponse.json({ error: "You have reached the current Scene creation limit." }, { status: 403 });
    }
    return NextResponse.json({ error: "We couldn't create that Scene. Please try again." }, { status: 500 });
  }
}

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;
  const scenes = await prisma.scene.findMany({
    where: {
      active: true,
      OR: [
        { visibility: "PUBLIC" },
        ...(userId ? [{ members: { some: { userId, status: "ACTIVE" as const } } }] : []),
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 30,
    select: {
      id: true, name: true, slug: true, description: true, category: true,
      coverUrl: true, visibility: true, createdAt: true,
      _count: { select: { members: { where: { status: "ACTIVE" } } } },
    },
  });
  return NextResponse.json({ scenes });
}
