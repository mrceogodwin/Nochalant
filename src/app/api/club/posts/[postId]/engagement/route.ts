import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const actionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("LIKE") }),
  z.object({ action: z.literal("COMMENT"), body: z.string().trim().min(1).max(2000) }),
  z.object({ action: z.literal("VOTE"), option: z.string().trim().min(1).max(80) }),
]);

type RouteContext = { params: Promise<{ postId: string }> };

async function getViewer() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;
  return prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, status: true, ageAssurance: { select: { declaredAdult: true } } },
  });
}

async function canViewPost(postId: string, viewerId?: string) {
  const visibility: Prisma.ClubPostWhereInput[] = [{ audience: "EVERYONE" }];
  if (viewerId) visibility.push(
    { audience: "FOLLOWING", author: { followers: { some: { sourceId: viewerId } } } },
    { audience: "MY_SCENES", author: { sceneMemberships: { some: {
      status: "ACTIVE",
      scene: { members: { some: { userId: viewerId, status: "ACTIVE" } } },
    } } } },
  );
  return prisma.clubPost.findFirst({
    where: {
      id: postId,
      status: "PUBLISHED",
      OR: visibility,
      ...(viewerId ? {
        NOT: [
          { author: { blocksGiven: { some: { targetId: viewerId } } } },
          { author: { blocksReceived: { some: { sourceId: viewerId } } } },
        ],
      } : {}),
    },
    select: { id: true, kind: true, options: true },
  });
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const { postId } = await context.params;
  const viewer = await getViewer();
  const post = await canViewPost(postId, viewer?.id);
  if (!post) return NextResponse.json({ error: "Post not found." }, { status: 404 });

  const [likeCount, commentCount, voteCounts, liked, myVote, comments] = await Promise.all([
    prisma.clubPostLike.count({ where: { postId } }),
    prisma.clubPostComment.count({ where: { postId, status: "PUBLISHED" } }),
    prisma.clubPollVote.groupBy({ by: ["option"], where: { postId }, _count: { _all: true } }),
    viewer ? prisma.clubPostLike.findUnique({ where: { postId_userId: { postId, userId: viewer.id } }, select: { id: true } }) : null,
    viewer ? prisma.clubPollVote.findUnique({ where: { postId_userId: { postId, userId: viewer.id } }, select: { option: true } }) : null,
    prisma.clubPostComment.findMany({
      where: { postId, status: "PUBLISHED" },
      orderBy: { createdAt: "asc" },
      take: 50,
      select: { id: true, body: true, createdAt: true, author: { select: { username: true, displayName: true, profile: { select: { avatarUrl: true } } } } },
    }),
  ]);
  return NextResponse.json({
    likeCount, commentCount, voteCounts: voteCounts.map(row => ({ option: row.option, count: row._count._all })),
    liked: Boolean(liked), myVote: myVote?.option ?? null, comments,
  });
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { postId } = await context.params;
  const viewer = await getViewer();
  if (!viewer) return NextResponse.json({ error: "Sign in to interact with the Club." }, { status: 401 });
  if (viewer.status !== "ACTIVE") return NextResponse.json({ error: "Your account cannot interact with posts." }, { status: 403 });
  if (!viewer.ageAssurance?.declaredAdult) return NextResponse.json({ error: "Complete the 18+ age confirmation before interacting." }, { status: 403 });

  const parsed = actionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid action." }, { status: 400 });

  const post = await canViewPost(postId, viewer.id);
  if (!post) return NextResponse.json({ error: "Post not found." }, { status: 404 });

  if (parsed.data.action === "LIKE") {
    const result = await prisma.$transaction(async tx => {
      const existing = await tx.clubPostLike.findUnique({
        where: { postId_userId: { postId, userId: viewer.id } },
        select: { id: true },
      });
      if (existing) {
        await tx.clubPostLike.delete({ where: { id: existing.id } });
        return { liked: false, likeCount: await tx.clubPostLike.count({ where: { postId } }) };
      }
      await tx.clubPostLike.createMany({
        data: [{ postId, userId: viewer.id }],
        skipDuplicates: true,
      });
      const liked = Boolean(await tx.clubPostLike.findUnique({
        where: { postId_userId: { postId, userId: viewer.id } },
        select: { id: true },
      }));
      return { liked, likeCount: await tx.clubPostLike.count({ where: { postId } }) };
    });
    return NextResponse.json(result);
  }

  if (parsed.data.action === "COMMENT") {
    const comment = await prisma.clubPostComment.create({
      data: { postId, authorId: viewer.id, body: parsed.data.body },
      select: { id: true, body: true, createdAt: true, author: { select: { username: true, displayName: true, profile: { select: { avatarUrl: true } } } } },
    });
    const commentCount = await prisma.clubPostComment.count({ where: { postId, status: "PUBLISHED" } });
    return NextResponse.json({ comment, commentCount }, { status: 201 });
  }

  if (post.kind !== "POLL" || !Array.isArray(post.options) || !post.options.includes(parsed.data.option)) {
    return NextResponse.json({ error: "Choose an option from this poll." }, { status: 400 });
  }
  const vote = await prisma.clubPollVote.upsert({
    where: { postId_userId: { postId, userId: viewer.id } },
    create: { postId, userId: viewer.id, option: parsed.data.option },
    update: { option: parsed.data.option },
    select: { option: true },
  });
  const voteCounts = await prisma.clubPollVote.groupBy({ by: ["option"], where: { postId }, _count: { _all: true } });
  return NextResponse.json({ myVote: vote.option, voteCounts: voteCounts.map(row => ({ option: row.option, count: row._count._all })) });
}
