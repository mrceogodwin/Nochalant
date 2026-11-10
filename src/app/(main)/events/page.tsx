import Link from "next/link";
import { Cover, Mascot } from "@/components/brand";
import { RemindButton } from "@/components/forms";
import { BackHeader } from "@/components/shell";
import { requireUser } from "@/lib/auth";
import { listEvents } from "@/lib/data";
import { compact } from "@/lib/format";

export default async function EventsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const user = await requireUser();
  const tab = (await searchParams).tab || "all";
  const events = await listEvents(user.id);
  const shown = events.filter((event) => {
    if (tab === "live") return event.isLive;
    if (tab === "upcoming") return !event.isLive;
    if (tab === "mine") return event.reminded;
    return true;
  });
  const live = shown.find((event) => event.isLive);
  const rest = shown.filter((event) => event !== live);
  return (
    <main className="px-4 pt-2">
      <BackHeader back="/discover" />
      <div className="relative">
        <h1 className="mt-3 text-4xl font-extrabold">Events & Agenda</h1>
        <p className="max-w-[240px] text-sm text-zinc-300">Live Scenes, Shows, Games, Music, and special community events.</p>
        <span className="absolute right-0 top-0"><Mascot size={88} /></span>
      </div>
      <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto">
        {[
          ["all", "All Events"],
          ["live", "Live Now"],
          ["upcoming", "Upcoming"],
          ["mine", "My Events"],
        ].map(([id, label]) => (
          <Link key={id} href={`/events?tab=${id}`} className={`rounded-full px-3 py-2 text-sm font-bold ${tab === id ? "orange-fill text-black" : "bg-white/5"}`}>{label}</Link>
        ))}
      </div>
      {live ? (
        <Link href={live.sceneSlug ? `/scene/${live.sceneSlug}` : "/home"} className="mt-4 block rounded-3xl bg-gradient-to-r from-[#3a0c00] to-black p-4">
          <p className="text-xs font-bold text-[#ff4d4d]">LIVE · {compact(live.listenerCount)} listening</p>
          <h2 className="mt-1 text-2xl font-extrabold">{live.title}</h2>
          <p className="text-sm text-zinc-300">{live.category}</p>
          <p className="mt-1 text-sm">Hosted by {live.hostName}</p>
          <span className="mt-3 inline-flex rounded-full bg-[#ff7a00] px-4 py-2 text-sm font-bold text-black">Join Live</span>
        </Link>
      ) : null}
      <h2 className="mb-2 mt-5 font-extrabold">Upcoming Events</h2>
      <div className="space-y-3">
        {rest.map((event) => (
          <div key={event.id} className="card flex items-center gap-3 rounded-2xl p-3">
            <Cover kind={event.coverKey} className="h-14 w-14" />
            <div className="flex-1">
              <p className="font-bold">{event.title}</p>
              <p className="text-xs text-zinc-400">{event.description}</p>
              <p className="text-xs text-zinc-500">{new Date(event.startsAt).toLocaleString("en-NG", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</p>
            </div>
            <RemindButton eventId={event.id} reminded={event.reminded} />
          </div>
        ))}
      </div>
    </main>
  );
}
