import Link from "next/link";
import { Avatar, Mascot } from "@/components/brand";
import { BackHeader } from "@/components/shell";
import { requireUser } from "@/lib/auth";
import { creators, leaderboard, mostActive } from "@/lib/data";
import { formatNaira } from "@/lib/format";

const tabs = [
  ["overall", "Overall"],
  ["gifters", "Top Gifters"],
  ["creators", "Top Creators"],
  ["active", "Most Active"],
];

export default async function LeaderboardPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  await requireUser();
  const tab = (await searchParams).tab || "overall";
  const rows = tab === "creators" ? await creators() : tab === "active" ? await mostActive() : await leaderboard();
  const podium = [rows[1], rows[0], rows[2]].filter(Boolean);
  return (
    <main className="px-4 pt-2">
      <BackHeader back="/gifts" />
      <div className="relative">
        <h1 className="mt-3 text-4xl font-extrabold">Leaderboard</h1>
        <p className="max-w-[240px] text-sm text-zinc-300">Top members, top gifters, top creators and most active in the community.</p>
        <span className="absolute right-0 top-0"><Mascot size={90} /></span>
      </div>
      <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto">
        {tabs.map(([id, label]) => (
          <Link key={id} href={`/leaderboard?tab=${id}`} className={`rounded-full px-3 py-2 text-sm font-bold ${tab === id ? "orange-fill text-black" : "bg-white/5"}`}>{label}</Link>
        ))}
      </div>
      <div className="mt-6 grid grid-cols-3 items-end gap-2 text-center">
        {podium.map((person, index) => (
          <div key={person.id} className={index === 1 ? "-mt-4" : "mt-6"}>
            <Avatar username={person.username} size={index === 1 ? 72 : 56} mascot={person.username === "blaqsoul"} />
            <p className="mt-1 text-sm font-bold">{person.displayName}</p>
            <p className="text-[11px] text-[#ffb000]">{tab === "creators" ? person.score.toLocaleString("en-US") : tab === "active" ? `${person.score} posts` : formatNaira(person.score)}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 space-y-2">
        {rows.slice(3).map((person, index) => (
          <div key={person.id} className="card flex items-center gap-3 rounded-2xl px-3 py-2">
            <span className="w-5 text-sm text-zinc-400">{index + 4}</span>
            <Avatar username={person.username} size={36} />
            <span className="flex-1 font-bold">{person.displayName} {person.verified ? "✓" : ""}</span>
            <span className="text-sm text-[#ffb000]">{tab === "active" ? person.score : formatNaira(person.score)}</span>
          </div>
        ))}
      </div>
    </main>
  );
}
