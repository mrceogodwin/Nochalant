import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
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

  const author = await prisma.user.findUnique({
    where: { id: authorId },
    select: { status: true, ageAssurance: { select: { declaredAdult: true } } },
  });
  if (!author || author.status !== "ACTIVE") {
    return NextResponse.json({ error: "Your account cannot publish right now." }, { status: 403 });
  }
  if (!author.ageAssurance?.declaredAdult) {
    return NextResponse.json({ error: "Complete the 18+ age confirmation before publishing." }, { status: 403 });
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

export async function GET(request: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id;
  const feed = request.nextUrl.searchParams.get("feed") ?? "for-you";
  if (!["for-you", "following", "scenes"].includes(feed)) {
    return NextResponse.json({ error: "Unknown feed." }, { status: 400 });
  }

  const visibility: Prisma.ClubPostWhereInput[] = [];
  if (feed === "for-you") {
    visibility.push({ audience: "EVERYONE" });
    if (userId) visibility.push(
      { audience: "FOLLOWING", author: { followers: { some: { sourceId: userId } } } },
      { audience: "MY_SCENES", author: { sceneMemberships: { some: {
        status: "ACTIVE", scene: { members: { some: { userId, status: "ACTIVE" } } },
      } } } },
    );
  } else if (feed === "following" && userId) {
    visibility.push({ audience: "FOLLOWING", author: { followers: { some: { sourceId: userId } } } });
  } else if (feed === "scenes" && userId) {
    visibility.push({ audience: "MY_SCENES", author: { sceneMemberships: { some: {
      status: "ACTIVE", scene: { members: { some: { userId, status: "ACTIVE" } } },
    } } } });
  }

  const posts = visibility.length ? await prisma.clubPost.findMany({
    where: { status: "PUBLISHED", OR: visibility },
    orderBy: { createdAt: "desc" },
    take: 40,
    select: {
      id: true, kind: true, body: true, options: true, audience: true, createdAt: true,
      author: { select: { id: true, username: true, displayName: true, profile: { select: { avatarUrl: true, clubId: true } } } },
      _count: { select: { likes: true, comments: { where: { status: "PUBLISHED" } } } },
      likes: userId ? { where: { userId }, select: { id: true }, take: 1 } : false,
      pollVotes: userId ? { where: { userId }, select: { option: true }, take: 1 } : false,
      comments: {
        where: { status: "PUBLISHED" },
        orderBy: { createdAt: "desc" },
        take: 3,
        select: { id: true, body: true, createdAt: true, author: { select: { username: true, displayName: true, profile: { select: { avatarUrl: true } } } } },
      },
    },
  }) : [];
  const postIds = posts.map(post => post.id);
  const voteGroups = postIds.length ? await prisma.clubPollVote.groupBy({
    by: ["postId", "option"],
    where: { postId: { in: postIds } },
    _count: { _all: true },
  }) : [];
  const votesByPost = new Map<string, { option: string; count: number }[]>();
  for (const vote of voteGroups) {
    const rows = votesByPost.get(vote.postId) ?? [];
    rows.push({ option: vote.option, count: vote._count._all });
    votesByPost.set(vote.postId, rows);
  }
  return NextResponse.json({ posts: posts.map(({ _count, likes, pollVotes, comments, ...post }) => ({
    ...post,
    engagement: {
      likeCount: _count.likes,
      commentCount: _count.comments,
      voteCounts: votesByPost.get(post.id) ?? [],
      liked: likes.length > 0,
      myVote: pollVotes[0]?.option ?? null,
      comments: comments.reverse(),
    },
  })) });
}
