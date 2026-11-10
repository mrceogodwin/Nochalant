import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { Avatar, Cover, Mascot } from "@/components/brand";
import { Logo, NotifyButton, SectionTitle } from "@/components/shell";
import { requireUser } from "@/lib/auth";
import { listChats, listGroups, listPeople, publicScenes, unreadNotes } from "@/lib/data";
import { compact } from "@/lib/format";

const tabs = [
  { id: "live", label: "Live", icon: "📡" },
  { id: "chats", label: "Chats", icon: "💬" },
  { id: "scenes", label: "Scenes", icon: "🎙️" },
  { id: "groups", label: "Groups", icon: "👥" },
  { id: "people", label: "People", icon: "👤" },
  { id: "games", label: "Games", icon: "🎮" },
];

export default async function HomePage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const user = await requireUser();
  const tab = (await searchParams).tab || "live";
  const [scenes, groups, people, chats, notes] = await Promise.all([
    publicScenes(),
    listGroups(user.id),
    listPeople(user.id),
    listChats(user.id),
    unreadNotes(user.id),
  ]);
  const live = scenes.filter((scene) => scene.coverKey.startsWith("cast"));
  const trending = scenes.filter((scene) => scene.trendLabel);

  return (
    <main className="px-4 pt-4">
      <header className="grid grid-cols-[40px_1fr_84px] items-center">
        <Avatar username={user.username} name={user.displayName} src={user.avatarUrl} size={40} />
        <div className="flex justify-center">
          <Logo size="sm" />
        </div>
        <div className="flex justify-end">
          <NotifyButton dot={notes > 0} />
          <Link href="/chats" className="grid h-10 w-10 place-items-center" aria-label="Chats">
            <MessageCircle size={22} />
          </Link>
        </div>
      </header>
      <h1 className="mt-4 text-[30px] font-extrabold leading-tight">Hello, {user.displayName} 👋</h1>
      <p className="text-zinc-400">What&apos;s the vibe today?</p>
      <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto">
        {tabs.map((item) => (
          <Link
            key={item.id}
            href={`/home?tab=${item.id}`}
            className={`flex min-w-[74px] flex-col items-center gap-1 rounded-2xl px-3 py-3 text-xs font-bold ${tab === item.id ? "orange-fill text-black" : "bg-white/5 text-zinc-300"}`}
          >
            <span>{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </div>

      {tab === "live" ? (
        <section className="mt-6">
          <SectionTitle title="Live Now" href="/discover?filter=scenes" />
          <div className="no-scrollbar flex gap-3 overflow-x-auto">
            {live.map((scene) => (
              <Link key={scene.id} href={`/scene/${scene.slug}`} className="relative h-56 w-40 shrink-0 overflow-hidden rounded-3xl bg-zinc-900">
                <span className="absolute inset-0">
                  <Avatar username={scene.hostUsername} size={220} />
                </span>
                <span className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                <span className="absolute left-2 top-2 rounded-full bg-[#ff2d2d] px-2 py-0.5 text-[10px] font-bold">LIVE · {compact(scene.listenerCount)}</span>
                <span className="absolute bottom-3 left-3 right-3">
                  <span className="block font-extrabold leading-tight">{scene.title}</span>
                  <span className="text-xs text-zinc-300">{scene.category}</span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {tab === "chats" ? (
        <section className="mt-6">
          <SectionTitle title="Active Chats" href="/chats" hot />
          <div className="no-scrollbar flex gap-3 overflow-x-auto">
            {live.map((scene) => (
              <Link key={scene.id} href={`/scene/${scene.slug}?tab=chat`} className="relative h-52 w-40 shrink-0 overflow-hidden rounded-3xl bg-zinc-900">
                <Avatar username={scene.hostUsername} size={200} />
                <span className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-bold text-[#ff9a3c]">Ongoing · {compact(scene.listenerCount)}</span>
                <span className="absolute bottom-3 left-3 right-3 font-extrabold leading-tight">{scene.title}</span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {tab === "scenes" ? (
        <section className="mt-6 space-y-3">
          {scenes.map((scene) => (
            <Link key={scene.id} href={`/scene/${scene.slug}`} className="card flex items-center gap-3 rounded-3xl p-3">
              <Cover kind={scene.coverKey} className="h-14 w-14" />
              <span>
                <span className="block font-bold">{scene.title}</span>
                <span className="text-sm text-zinc-400">{compact(scene.listenerCount)} listening</span>
              </span>
            </Link>
          ))}
        </section>
      ) : null}

      {tab === "groups" ? (
        <section className="mt-6 grid grid-cols-2 gap-3">
          {groups.map((group) => (
            <Link key={group.id} href={`/group/${group.slug}`} className="card rounded-3xl p-3">
              <span className="text-2xl">{group.icon}</span>
              <span className="mt-2 block font-bold">{group.name}</span>
              <span className="text-xs text-zinc-400">{compact(group.memberCount)} members</span>
            </Link>
          ))}
        </section>
      ) : null}

      {tab === "people" ? (
        <section className="mt-6 space-y-3">
          {people.slice(0, 8).map((person) => (
            <Link key={person.id} href={`/u/${person.username}`} className="flex items-center gap-3">
              <Avatar username={person.username} name={person.displayName} src={person.avatarUrl} size={52} />
              <span>
                <span className="block font-bold">
                  {person.displayName} {person.verified ? <span className="text-[#ff9a3c]">✓</span> : null}
                </span>
                <span className="text-sm text-zinc-400">{compact(person.followersCount)} followers</span>
              </span>
            </Link>
          ))}
        </section>
      ) : null}

      {tab === "games" ? (
        <section className="mt-6">
          <Link href="/games" className="card block rounded-3xl p-4">
            <p className="text-lg font-extrabold">Games Hub</p>
            <p className="text-sm text-zinc-400">Whot, Checkmate, Ludo and tonight&apos;s tournament.</p>
          </Link>
        </section>
      ) : null}

      <section className="mt-7">
        <SectionTitle title="Trending Scenes" href="/discover?filter=scenes" hot />
        <div className="grid grid-cols-3 gap-2">
          {trending.map((scene) => (
            <Link key={scene.id} href={`/scene/${scene.slug}`} className="card rounded-2xl p-2">
              <Cover kind={scene.coverKey === "cast-a" ? "mic" : scene.coverKey} className="h-10 w-10" />
              <span className="mt-1 block text-sm font-bold leading-tight">{scene.title}</span>
              <span className="block truncate text-[10px] text-zinc-400">{scene.trendLabel}</span>
            </Link>
          ))}
        </div>
      </section>

      <Link href="/create" className="relative mt-6 block overflow-hidden rounded-3xl bg-gradient-to-r from-[#3a1200] via-[#7a2200] to-[#1a0500] p-4">
        <p className="text-2xl font-extrabold leading-tight">
          Create
          <br />
          <span className="text-[#ff9a1a]">your Scene</span>
        </p>
        <p className="mt-2 max-w-[180px] text-sm text-zinc-200">Start a live room, group or community for your people.</p>
        <span className="absolute bottom-3 right-3">
          <Mascot size={110} pose="peek" />
        </span>
        <span className="absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-[#ff7a00] text-black">›</span>
      </Link>

      {chats[0] ? null : null}
    </main>
  );
}
