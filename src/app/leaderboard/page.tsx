"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Crown, Medal, Trophy } from "lucide-react";

type Leader = { position: number; username: string; displayName: string; xp: number; rank: string; identity: string | null };

export default function LeaderboardPage() {
  const [rows, setRows] = useState<Leader[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/leaderboard", { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to load the leaderboard.");
        return data.leaderboard as Leader[];
      })
      .then((data) => { if (active) setRows(data); })
      .catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : "Unable to load the leaderboard."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return (
    <main className="feed-shell">
      <header className="screen-heading">
        <Link href="/my-club" className="selection-hint inline-flex items-center gap-2"><ArrowLeft size={15}/> My Club</Link>
        <p className="mt-5 text-[10px] font-black tracking-[.25em] text-[#ed5266]">THE CLUB&apos;S CONTRIBUTION BOARD</p>
        <h1>Leaderboard</h1>
        <p>Recognition earned through real participation, not purchases.</p>
      </header>
      <section className="membership-row">
        <div><strong>All-time reputation</strong><small className="block text-white/50">Only discoverable, active member profiles appear here.</small></div>
        <Trophy size={23} className="text-[#e9c477]"/>
      </section>
      {error ? <div className="empty-state" role="alert">{error}</div> : null}
      {loading ? <div className="empty-state" role="status">Loading Club rankings…</div> : (
        <section className="admin-member-list" aria-label="Member leaderboard">
          {rows.map((item) => (
            <article key={item.username} className="!items-center">
              <div className="w-8 text-center font-black text-white/55">{item.position <= 3 ? item.position === 1 ? <Crown className="mx-auto text-[#e9c477]"/> : <Medal className="mx-auto text-[#c9b7a2]"/> : <><span>#</span>{item.position}</>}</div>
              <div className="admin-member-avatar">{item.displayName.trim().charAt(0).toUpperCase()}</div>
              <div className="admin-member-info">
                <strong>{item.displayName}</strong>
                <small>@{item.username} · {item.rank}</small>
                {item.identity ? <small>{item.identity}</small> : null}
              </div>
              <strong className="text-right tabular-nums">{item.xp.toLocaleString("en-NG")}<small className="block text-[9px] font-normal text-white/45">XP</small></strong>
            </article>
          ))}
          {!rows.length ? <div className="empty-state">No discoverable member rankings yet. Your community&apos;s progress will appear here.</div> : null}
        </section>
      )}
      <p className="selection-hint">Rankings use active reputation events. Reversed events do not count. Members who hide their profile are excluded.</p>
      <nav className="bottom-nav">
        <Link href="/club">⌂<small>Home</small></Link><Link href="/discover">◉<small>Discover</small></Link>
        <Link className="create-button" href="/club/create">＋</Link><Link href="/chats">▢<small>Chats</small></Link>
        <Link className="active" href="/my-club">♙<small>My Club</small></Link>
      </nav>
    </main>
  );
}
