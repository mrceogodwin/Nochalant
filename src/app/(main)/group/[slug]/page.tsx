import Link from "next/link";
import { notFound } from "next/navigation";
import { Avatar, Cover, GladiatorArt, Mascot } from "@/components/brand";
import { JoinGroupButton, PostActions, PostComposer } from "@/components/forms";
import { BackHeader } from "@/components/shell";
import { requireUser } from "@/lib/auth";
import { getGroup, groupMembers, groupPosts, publicScenes } from "@/lib/data";
import { compact, relativeTime } from "@/lib/format";

const tabs = ["posts", "scenes", "chat", "members", "media", "about"];
const filters = [
  ["all", "All Posts"],
  ["trending", "Trending"],
  ["reviews", "Reviews"],
  ["news", "News"],
];

export default async function GroupPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tab?: string; filter?: string }>;
}) {
  const user = await requireUser();
  const { slug } = await params;
  const query = await searchParams;
  const tab = query.tab || "posts";
  const filter = query.filter || "all";
  const group = await getGroup(slug, user.id);
  if (!group) notFound();
  const [posts, members, scenes] = await Promise.all([
    groupPosts(group.id, user.id, filter),
    groupMembers(group.id),
    publicScenes(),
  ]);
  const related = scenes.filter((scene) => scene.groupSlug === slug);

  return (
    <main className="px-4 pt-2">
      <BackHeader back="/discover" right={<Link href="/notifications">🔔</Link>} />
      <div className="relative mt-3 overflow-hidden rounded-3xl bg-gradient-to-r from-[#2a0808] to-black p-4">
        <div className="flex gap-3">
          <span className="grid h-16 w-16 place-items-center rounded-2xl bg-black/40 text-3xl">{group.icon}</span>
          <div className="flex-1">
            <h1 className="text-2xl font-extrabold">
              {group.name} <span className="text-[#ff9a3c]">✓</span>
            </h1>
            <p className="text-sm text-zinc-300">{group.category}</p>
            <p className="text-sm text-zinc-400">{compact(group.memberCount)} members</p>
          </div>
          <JoinGroupButton slug={group.slug} joined={group.joined} />
        </div>
        <span className="pointer-events-none absolute -right-2 bottom-0">
          <Mascot size={92} />
        </span>
      </div>
      <p className="mt-3 text-sm leading-5 text-zinc-300">{group.description}</p>
      <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto">
        {tabs.map((item) => (
          <Link key={item} href={`/group/${slug}?tab=${item}`} className={`rounded-2xl px-3 py-2 text-sm font-bold capitalize ${tab === item ? "orange-fill text-black" : "bg-white/5"}`}>
            {item}
          </Link>
        ))}
      </div>

      {tab === "posts" ? (
        <section className="mt-4 space-y-4">
          <PostComposer slug={slug} />
          <div className="no-scrollbar flex gap-2 overflow-x-auto">
            {filters.map(([id, label]) => (
              <Link key={id} href={`/group/${slug}?tab=posts&filter=${id}`} className={`rounded-full px-3 py-1.5 text-xs font-bold ${filter === id ? "orange-fill text-black" : "bg-white/5"}`}>
                {label}
              </Link>
            ))}
          </div>
          {posts.map((post) => (
            <article key={post.id} className="card rounded-3xl p-3">
              <div className="flex items-center gap-2">
                <Avatar username={post.username} name={post.displayName} src={post.avatarUrl} size={36} mascot={post.username === "blaqsoul"} />
                <div>
                  <p className="text-sm font-bold">
                    {post.displayName} {post.verified ? <span className="text-[#ff9a3c]">✓</span> : null}
                  </p>
                  <p className="text-xs text-zinc-500">{relativeTime(post.createdAt)}</p>
                </div>
              </div>
              <p className="mt-2 text-sm leading-5">{post.body}</p>
              {post.mediaKey === "gladiator" ? (
                <div className="mt-3">
                  <GladiatorArt />
                </div>
              ) : null}
              <PostActions postId={post.id} slug={slug} liked={post.liked} likes={post.likes} comments={post.commentsCount} reposts={post.reposts} saved={post.saved} />
            </article>
          ))}
          {posts.length === 0 ? <p className="text-sm text-zinc-400">No posts in this filter yet.</p> : null}
        </section>
      ) : null}

      {tab === "scenes" ? (
        <section className="mt-4 space-y-3">
          {related.length === 0 ? <p className="text-sm text-zinc-400">No live scenes in this group yet.</p> : null}
          {related.map((scene) => (
            <Link key={scene.id} href={`/scene/${scene.slug}`} className="card flex items-center gap-3 rounded-2xl p-3">
              <Cover kind={scene.coverKey} className="h-12 w-12" />
              <span>
                <span className="block font-bold">{scene.title}</span>
                <span className="text-xs text-zinc-400">{scene.isLive ? "LIVE · " : ""}{compact(scene.listenerCount)}</span>
              </span>
            </Link>
          ))}
        </section>
      ) : null}

      {tab === "chat" ? (
        <p className="mt-6 text-sm text-zinc-300">
          Group chat lives in your inbox.{" "}
          <Link href="/chats" className="font-bold text-[#ff7a00]">
            Open Chats
          </Link>
        </p>
      ) : null}

      {tab === "members" ? (
        <section className="mt-4 space-y-3">
          {members.map((member) => (
            <Link key={member.id} href={`/u/${member.username}`} className="flex items-center gap-3">
              <Avatar username={member.username} size={44} mascot={member.username === "blaqsoul"} />
              <span>
                <span className="block font-bold">{member.displayName}</span>
                <span className="text-xs capitalize text-zinc-400">{member.role}</span>
              </span>
            </Link>
          ))}
        </section>
      ) : null}

      {tab === "media" ? (
        <section className="mt-4">
          {posts.filter((post) => post.mediaKey).map((post) => (
            <GladiatorArt key={post.id} />
          ))}
        </section>
      ) : null}

      {tab === "about" ? (
        <section className="card mt-4 rounded-3xl p-4 text-sm leading-6 text-zinc-200">
          <p>{group.description}</p>
          <p className="mt-3 text-zinc-400">{compact(group.memberCount)} members · {group.category}</p>
        </section>
      ) : null}
    </main>
  );
}
