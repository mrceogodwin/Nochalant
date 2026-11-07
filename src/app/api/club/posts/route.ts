import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const schema = z.object({
  kind: z.enum(["POST", "SCENE", "POLL"]),
  body: z.string().trim().min(1).max(5000),
  options: z.array(z.string().trim().min(1).max(80)).max(4).optional(),
  audience: z.enum(["EVERYONE", "FOLLOWING", "MY_SCENES"]).default("EVERYONE"),
}).strict().superRefine((value, ctx) => {
  if (value.kind === "POLL") {
    const options = value.options ?? [];
    if (options.length < 2) ctx.addIssue({ code: "custom", path: ["options"], message: "A poll needs at least two options." });
    if (new Set(options.map(option => option.toLowerCase())).size !== options.length) {
      ctx.addIssue({ code: "custom", path: ["options"], message: "Poll options must be different." });
    }
  } else if (value.options?.length) {
    ctx.addIssue({ code: "custom", path: ["options"], message: "Only polls can have options." });
  }
});

export async function POST(request: NextRequest) {
  const session = await auth();
  const authorId = session?.user?.id;
  if (!authorId) return NextResponse.json({ error: "Sign in to publish in the Club." }, { status: 401 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Check your post and try again." }, { status: 400 });
  }

  try {
    const post = await prisma.clubPost.create({
      data: {
        authorId,
        kind: parsed.data.kind,
        body: parsed.data.body,
        options: parsed.data.kind === "POLL" ? parsed.data.options : undefined,
        audience: parsed.data.audience,
        status: "PUBLISHED",
      },
      select: {
        id: true, kind: true, body: true, options: true, audience: true, createdAt: true,
        author: { select: { id: true, username: true, displayName: true, profile: { select: { avatarUrl: true, clubId: true } } } },
      },
    });
    return NextResponse.json({ post }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "We couldn't publish your post. Please try again." }, { status: 500 });
  }
}

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;
  const posts = await prisma.clubPost.findMany({
    where: {
      status: "PUBLISHED",
      OR: [
        { audience: "EVERYONE" },
        ...(userId ? [
          { audience: "FOLLOWING", author: { followers: { some: { sourceId: userId } } } },
          { audience: "MY_SCENES", author: { sceneMemberships: { some: { userId, status: "ACTIVE" } } } },
        ] : []),
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 40,
    select: {
      id: true, kind: true, body: true, options: true, audience: true, createdAt: true,
      author: { select: { id: true, username: true, displayName: true, profile: { select: { avatarUrl: true, clubId: true } } } },
    },
  });
  return NextResponse.json({ posts });
}
