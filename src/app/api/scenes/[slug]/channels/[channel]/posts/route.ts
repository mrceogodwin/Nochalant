import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type Context = { params: Promise<{ slug: string; channel: string }> };
const postSchema = z.object({
  body: z.string().trim().min(1).max(10000),
}).strict();

async function resolveAccess(slug: string, channelSlug: string, userId?: string) {
  const scene = await prisma.scene.findFirst({
    where: { slug, active: true },
    select: {
      id: true, founderId: true, visibility: true,
      channels: { where: { slug: channelSlug, archivedAt: null }, take: 1, select: { id: true, name: true, slug: true, description: true } },
    },
  });
  if (!scene || !scene.channels[0]) return { error: "Channel not found.", status: 404 as const };
  if (scene.visibility === "UNLISTED" && scene.founderId !== userId) {
    const invite = userId ? await prisma.sceneMember.findFirst({ where: { sceneId: scene.id, userId, status: "ACTIVE" }, select: { id: true } }) : null;
    if (!invite) return { error: "This Scene is not available.", status: 404 as const };
  }
  if (scene.visibility !== "PUBLIC" && scene.founderId !== userId) {
    const membership = userId ? await prisma.sceneMember.findUnique({
      where: { sceneId_userId: { sceneId: scene.id, userId } },
      select: { status: true },
    }) : null;
    if (membership?.status !== "ACTIVE") return { error: "Join this Scene to view its conversations.", status: 403 as const };
  }
  return { scene, channel: scene.channels[0] };
}

export async function GET(_request: NextRequest, context: Context) {
  const { slug, channel } = await context.params;
  const userId = (await auth())?.user?.id;
  const access = await resolveAccess(slug, channel, userId);
  if ("error" in access) return NextResponse.json({ error: access.error }, { status: access.status });

  const posts = await prisma.scenePost.findMany({
    where: {
      sceneId: access.scene.id,
      channelId: access.channel.id,
      status: "PUBLISHED",
      ...(userId ? {
        NOT: [
          { authorId: { in: (await prisma.userBlock.findMany({
            where: { OR: [{ sourceId: userId }, { targetId: userId }] },
            select: { sourceId: true, targetId: true },
          })).map(block => block.sourceId === userId ? block.targetId : block.sourceId) } },
        ],
      } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: { id: true, authorId: true, body: true, media: true, createdAt: true },
  });
  const authorIds = [...new Set(posts.map(post => post.authorId))];
  const authors = await prisma.user.findMany({
    where: { id: { in: authorIds } },
    select: { id: true, username: true, displayName: true, profile: { select: { avatarUrl: true } } },
  });
  const byId = new Map(authors.map(author => [author.id, author]));
  return NextResponse.json({
    channel: access.channel,
    posts: posts.map(post => ({
      id: post.id, body: post.body, media: post.media, createdAt: post.createdAt,
      author: byId.get(post.authorId) ?? null,
    })),
  });
}

export async function POST(request: NextRequest, context: Context) {
  const userId = (await auth())?.user?.id;
  if (!userId) return NextResponse.json({ error: "Sign in to post in this Scene." }, { status: 401 });
  const parsed = postSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Write a message before posting." }, { status: 400 });

  const member = await prisma.user.findUnique({
    where: { id: userId },
    select: { status: true, ageAssurance: { select: { declaredAdult: true } } },
  });
  if (!member || member.status !== "ACTIVE") return NextResponse.json({ error: "Your account cannot post right now." }, { status: 403 });
  if (member.ageAssurance?.declaredAdult !== true) return NextResponse.json({ error: "Complete age confirmation before posting." }, { status: 403 });

  const { slug, channel } = await context.params;
  const access = await resolveAccess(slug, channel, userId);
  if ("error" in access) return NextResponse.json({ error: access.error }, { status: access.status });
  const membership = await prisma.sceneMember.findUnique({
    where: { sceneId_userId: { sceneId: access.scene.id, userId } },
    select: { status: true },
  });
  if (access.scene.founderId !== userId && membership?.status !== "ACTIVE") {
    return NextResponse.json({ error: "Only active Scene members can publish here." }, { status: 403 });
  }

  const post = await prisma.scenePost.create({
    data: { sceneId: access.scene.id, channelId: access.channel.id, authorId: userId, body: parsed.data.body, status: "PUBLISHED" },
    select: { id: true, body: true, createdAt: true },
  });
  return NextResponse.json({ post: { ...post, author: { id: userId } } }, { status: 201 });
}
