import Link from "next/link";
import { notFound } from "next/navigation";
import { Avatar } from "@/components/brand";
import { CopyLink, MessageLike, SceneComposer, SpeakBar } from "@/components/forms";
import { BackHeader } from "@/components/shell";
import { requireUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { getScene, sceneMembers, sceneMessages, speakRequests } from "@/lib/data";
import { compact, relativeTime } from "@/lib/format";
import { joinScene, leaveScene } from "@/lib/actions";

const tabs = [
  { id: "room", label: "Room" },
  { id: "chat", label: "Chat" },
  { id: "people", label: "People" },
];

export default async function ScenePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const user = await requireUser();
  const { slug } = await params;
  const tab = (await searchParams).tab || "room";
  const scene = await getScene(slug);
  if (!scene) notFound();
  const db = getDb();
  await db`
    INSERT INTO social.scene_visits (user_id, scene_id, visited_at)
    VALUES (${user.id}, ${scene.id}, now())
    ON CONFLICT (user_id, scene_id) DO UPDATE SET visited_at = now()
  `;
  const [members, messages, requests] = await Promise.all([
    sceneMembers(scene.id),
    sceneMessages(scene.id, user.id),
    speakRequests(scene.id),
  ]);
  const me = members.find((member) => member.id === user.id);
  const speakers = members.filter((member) => member.role !== "listener");
  const listeners = members.filter((member) => member.role === "listener");

  return (
    <main className="px-4 pt-2">
      <BackHeader back="/home" right={<Link href={`/scene/${slug}/settings`} className="text-xl">⋯</Link>} />
      <div className="mt-3 flex gap-3">
        <span className="grid h-16 w-16 place-items-center rounded-2xl bg-orange-950/50">
          <Avatar username={scene.hostUsername} size={56} mascot={scene.hostUsername === "blaqsoul"} />
        </span>
        <div className="flex-1">
          <p className="text-xs font-bold text-[#ff4d4d]">LIVE · {compact(scene.listenerCount)}</p>
          <h1 className="text-2xl font-extrabold leading-tight">{scene.title}</h1>
          <p className="text-sm text-zinc-400">{scene.category}</p>
        </div>
        <form action={joinScene.bind(null, slug)}>
          <button className="rounded-full border border-[#ffb000] px-3 py-1 text-sm font-bold text-[#ffb000]">{me ? "Joined" : "Join"}</button>
        </form>
      </div>
      <p className="mt-3 text-sm text-zinc-300">{scene.description}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {scene.tags.map((tag) => (
          <span key={tag} className="rounded-full bg-white/8 px-3 py-1 text-xs text-zinc-300">
            # {tag}
          </span>
        ))}
      </div>
      {scene.isAdult ? <p className="mt-2 text-xs font-bold text-[#ff9a3c]">18+ scene</p> : null}
      <div className="mt-4 grid grid-cols-3 gap-2">
        {tabs.map((item) => (
          <Link key={item.id} href={`/scene/${slug}?tab=${item.id}`} className={`rounded-full py-2 text-center text-sm font-bold ${tab === item.id ? "orange-fill text-black" : "bg-white/5"}`}>
            {item.label}
            {item.id === "chat" && messages.length ? <span className="ml-1 inline-block h-2 w-2 rounded-full bg-[#ff3b30]" /> : null}
          </Link>
        ))}
      </div>

      {tab === "room" ? (
        <section className="mt-5">
          <h2 className="font-bold">Speakers ({speakers.length})</h2>
          <div className="mt-3 grid grid-cols-4 gap-2 text-center">
            {speakers.map((member) => (
              <div key={member.id}>
                <span className="mx-auto grid h-16 w-16 place-items-center overflow-hidden rounded-full ring-2 ring-[#ff7a00]">
                  <Avatar username={member.username} name={member.displayName} src={member.avatarUrl} size={64} mascot />
                </span>
                <p className="mt-1 truncate text-xs font-bold">
                  {member.displayName} {member.verified ? "✓" : ""}
                </p>
                <p className="text-[10px] text-[#ffb000]">{member.role === "cohost" ? "Co-host" : member.role === "host" ? "Host" : "Speaker"}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 flex items-center justify-between">
            <h2 className="font-bold">Listeners ({Math.max(scene.listenerCount - speakers.length, listeners.length).toLocaleString("en-US")})</h2>
            <Link href={`/scene/${slug}?tab=people`} className="text-sm font-semibold text-[#ff7a00]">See All ›</Link>
          </div>
          <div className="mt-3 flex">
            {listeners.slice(0, 8).map((member) => (
              <span key={member.id} className="-ml-2 grid h-10 w-10 place-items-center overflow-hidden rounded-full ring-2 ring-black first:ml-0">
                <Avatar username={member.username} size={40} mascot />
              </span>
            ))}
            <span className="ml-2 grid h-10 w-10 place-items-center rounded-full bg-zinc-800 text-[10px] font-bold">+{compact(scene.listenerCount)}</span>
          </div>
        </section>
      ) : null}

      {tab === "chat" ? (
        <section className="mt-4 space-y-4">
          {scene.pinnedMessage ? (
            <div className="card rounded-2xl p-3 text-sm">
              <p className="font-bold text-[#ffb000]">Pinned</p>
              <p className="mt-1 text-zinc-200">{scene.pinnedMessage}</p>
            </div>
          ) : null}
          {messages.map((message) => (
            <article key={message.id} className="flex gap-2">
              <Avatar username={message.username} size={40} mascot />
              <div className="flex-1">
                <p className="text-sm">
                  <span className="font-bold">{message.displayName}</span>{" "}
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] uppercase">{message.role}</span>{" "}
                  <span className="text-xs text-zinc-500">{relativeTime(message.createdAt)}</span>
                </p>
                <p className="text-sm text-zinc-100">{message.body}</p>
              </div>
              <MessageLike id={message.id} slug={slug} liked={message.liked} likes={message.likes} />
            </article>
          ))}
        </section>
      ) : null}

      {tab === "people" ? (
        <section className="mt-4 space-y-3">
          <p className="font-bold">In Room ({(speakers.length + Math.max(scene.listenerCount - speakers.length, listeners.length)).toLocaleString("en-US")})</p>
          <Link href={`/scene/${slug}/requests`} className="card flex items-center justify-between rounded-2xl px-4 py-4">
            <span>Requests to Speak ({requests.length})</span>
            <span>›</span>
          </Link>
          <Link href={`/scene/${slug}/invite`} className="card flex items-center justify-between rounded-2xl px-4 py-4">
            <span>Invite People</span>
            <span>›</span>
          </Link>
          <CopyLink path={`/scene/${slug}`} />
          <Link href={`/scene/${slug}/settings`} className="card flex items-center justify-between rounded-2xl px-4 py-4">
            <span>Room Settings</span>
            <span>›</span>
          </Link>
          <form action={leaveScene.bind(null, slug)}>
            <button className="mt-4 flex h-12 w-full items-center justify-center rounded-full border border-red-500 font-bold text-red-400">Leave Scene</button>
          </form>
        </section>
      ) : null}

      <div className="fixed bottom-24 left-1/2 z-30 w-[min(430px,100%)] -translate-x-1/2 bg-gradient-to-t from-black via-black/95 to-transparent px-4 pb-2 pt-3">
        {tab === "room" ? <SpeakBar slug={slug} role={me?.role ?? "listener"} /> : null}
        <div className="mt-3">
          <SceneComposer slug={slug} placeholder={tab === "chat" ? "Type a message..." : "Say something to the room..."} />
        </div>
      </div>
    </main>
  );
}
