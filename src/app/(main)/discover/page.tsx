import Link from "next/link";
import { Search, SlidersHorizontal } from "lucide-react";
import { Avatar, Cover } from "@/components/brand";
import { FollowButton } from "@/components/forms";
import { Logo, NotifyButton, SectionTitle } from "@/components/shell";
import { requireUser } from "@/lib/auth";
import { listGroups, listPeople, publicScenes, unreadNotes } from "@/lib/data";
import { compact } from "@/lib/format";

const filters = ["all", "scenes", "groups", "people", "games"];

export default async function DiscoverPage({ searchParams }: { searchParams: Promise<{ filter?: string; q?: string }> }) {
  const user = await requireUser();
  const params = await searchParams;
  const filter = params.filter || "all";
  const q = (params.q || "").trim().toLowerCase();
  const [scenes, groups, people, notes] = await Promise.all([
    publicScenes(),
    listGroups(user.id),
    listPeople(user.id),
    unreadNotes(user.id),
  ]);
  const match = (value: string) => !q || value.toLowerCase().includes(q);
  const shownScenes = scenes.filter((scene) => match(scene.title));
  const shownGroups = groups.filter((group) => match(group.name));
  const shownPeople = people.filter((person) => match(person.displayName) || match(person.username));
  const featured = shownScenes.find((scene) => scene.slug === "the-lounge") ?? shownScenes[0];

  return (
    <main className="px-4 pt-4">
      <header className="grid grid-cols-[40px_1fr_40px] items-center">
        <span />
        <div className="flex justify-center">
          <Logo size="sm" />
        </div>
        <div className="flex justify-end">
          <NotifyButton dot={notes > 0} />
        </div>
      </header>
      <h1 className="mt-3 text-[34px] font-extrabold leading-none">
        Discover <span className="text-base font-medium text-zinc-300">Explore Scenes, Groups and People in the club.</span>
      </h1>
      <form className="mt-4 flex gap-2" action="/discover">
        <label className="field flex h-12 flex-1 items-center gap-2 rounded-full px-4">
          <Search size={18} className="text-zinc-500" />
          <input name="q" defaultValue={params.q || ""} placeholder="Search scenes, groups, people..." className="w-full bg-transparent outline-none" />
          <input type="hidden" name="filter" value={filter} />
        </label>
        <Link href="/events" className="field grid h-12 w-12 place-items-center rounded-full" aria-label="More">
          <SlidersHorizontal size={18} />
        </Link>
      </form>
      <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto">
        {filters.map((item) => (
          <Link
            key={item}
            href={`/discover?filter=${item}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
            className={`rounded-full px-4 py-2 text-sm font-bold capitalize ${filter === item ? "orange-fill text-black" : "bg-white/5 text-zinc-200"}`}
          >
            {item === "all" ? "All" : item}
          </Link>
        ))}
      </div>

      {(filter === "all" || filter === "scenes") && featured ? (
        <section className="mt-5">
          <SectionTitle title="Featured Scenes" href="/home?tab=scenes" hot />
          <Link href={`/scene/${featured.slug}`} className="relative block overflow-hidden rounded-3xl bg-gradient-to-r from-[#3a0c00] to-[#1a0800] p-4">
            <p className="text-xs font-bold text-[#ffb000]">LIVE</p>
            <p className="mt-1 text-3xl font-extrabold">{featured.title}</p>
            <p className="text-sm text-zinc-300">{featured.category} · Vibes</p>
            <p className="mt-3 text-sm">{compact(featured.listenerCount)} listening</p>
            <Cover kind="mic" className="absolute bottom-2 right-2 h-28 w-28" />
          </Link>
        </section>
      ) : null}

      {(filter === "all" || filter === "groups") && (
        <section className="mt-6">
          <SectionTitle title="Popular Groups" href="/home?tab=groups" />
          <div className="grid grid-cols-4 gap-2">
            {shownGroups.slice(0, 4).map((group) => (
              <Link key={group.id} href={`/group/${group.slug}`} className="card rounded-2xl p-2 text-center">
                <span className="text-xl">{group.icon}</span>
                <span className="mt-1 block text-xs font-bold leading-tight">{group.name}</span>
                <span className="text-[10px] text-zinc-400">{compact(group.memberCount)}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {(filter === "all" || filter === "people") && (
        <section className="mt-6">
          <SectionTitle title="Suggested People" href="/home?tab=people" />
          <div className="no-scrollbar flex gap-3 overflow-x-auto pb-2">
            {shownPeople.slice(0, 8).map((person) => (
              <div key={person.id} className="w-28 shrink-0 text-center">
                <Link href={`/u/${person.username}`}>
                  <span className="mx-auto grid h-16 w-16 place-items-center overflow-hidden rounded-full">
                    <Avatar username={person.username} name={person.displayName} src={person.avatarUrl} size={64} />
                  </span>
                  <span className="mt-1 block text-sm font-bold">
                    {person.displayName} {person.verified ? <span className="text-[#ff9a3c]">✓</span> : null}
                  </span>
                  <span className="block text-[11px] text-zinc-400">{compact(person.followersCount)} followers</span>
                </Link>
                <div className="mt-2 flex justify-center">
                  <FollowButton userId={person.id} following={person.following} compact />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {filter === "games" ? (
        <Link href="/games" className="card mt-6 block rounded-3xl p-4">
          <p className="text-xl font-extrabold">Games Hub</p>
          <p className="text-sm text-zinc-400">Whot, Checkmate and Ludo are open.</p>
        </Link>
      ) : null}
    </main>
  );
}
