import Link from "next/link";
import { Cover, Mascot } from "@/components/brand";
import { BackHeader } from "@/components/shell";
import { requireUser } from "@/lib/auth";
import { listGames, liveMatch } from "@/lib/data";
import { compact } from "@/lib/format";

export default async function GamesPage() {
  await requireUser();
  const [games, match] = await Promise.all([listGames(), liveMatch()]);
  return (
    <main className="px-4 pt-2">
      <BackHeader back="/discover" />
      <div className="relative">
        <h1 className="mt-3 text-4xl font-extrabold">Games Hub</h1>
        <p className="text-sm text-zinc-300">Play. Compete. Chill with your people.</p>
        <span className="absolute right-0 top-0"><Mascot size={88} /></span>
      </div>
      <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto">
        {["All Games", "Tournaments", "My Matches", "Leaderboard"].map((label, index) => (
          <Link key={label} href={index === 3 ? "/leaderboard" : index === 1 ? "/events?tab=upcoming" : "/games"} className={`rounded-full px-3 py-2 text-sm font-bold ${index === 0 ? "orange-fill text-black" : "bg-white/5"}`}>{label}</Link>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        {games.map((game) => (
          <Link key={game.slug} href={game.slug === "more" ? "/games/more" : `/games/${game.slug}`} className="relative h-36 overflow-hidden rounded-3xl bg-gradient-to-br from-[#2a1008] to-black p-3">
            <Cover kind={game.coverKey} className="absolute right-1 top-2 h-16 w-16" />
            <p className="absolute bottom-3 left-3 right-3 font-extrabold">{game.name}</p>
            <p className="absolute bottom-3 right-3 text-[11px] text-zinc-300">{compact(game.playing)} playing</p>
          </Link>
        ))}
      </div>
      <Link href="/events" className="mt-4 flex items-center justify-between rounded-3xl border border-[#ff9a1a]/40 p-4">
        <span>
          <span className="font-extrabold">Nochalant Game Tournament</span>
          <span className="block text-sm text-zinc-400">Whot · Ludo · Checkmate</span>
        </span>
        <span className="text-sm font-bold text-[#ffb000]">Join Tournament ›</span>
      </Link>
      {match ? (
        <div className="mt-4">
          <div className="mb-2 flex justify-between">
            <h2 className="font-extrabold">Ongoing Matches</h2>
            <Link href="/games/whot" className="text-sm text-[#ff7a00]">View All</Link>
          </div>
          <div className="card flex items-center justify-between rounded-2xl px-3 py-3">
            <span className="font-bold">{match.aName}</span>
            <span className="text-xs text-zinc-400">VS</span>
            <span className="font-bold">{match.bName}</span>
            <span className="text-xs text-[#ff4d4d]">LIVE · {match.watching} watching</span>
          </div>
        </div>
      ) : null}
    </main>
  );
}
