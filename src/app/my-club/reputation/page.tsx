"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowUpRight, Clock3 } from "lucide-react";

type EventItem = { id: string; label: string; points: number; createdAt: string; status: "ACTIVE" | "REVERSED" };
type HistoryData = { xp: number; activeEvents: number; rank: { name: string; minXp: number } | null; events: EventItem[] };

export default function ReputationHistoryPage() {
  const [data, setData] = useState<HistoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    fetch("/api/me/reputation/history", { cache: "no-store" })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Unable to load reputation history.");
        return result as HistoryData;
      })
      .then((result) => { if (active) setData(result); })
      .catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : "Unable to load reputation history."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return (
    <main className="feed-shell">
      <header className="screen-heading">
        <Link href="/my-club" className="selection-hint inline-flex items-center gap-2"><ArrowLeft size={15}/> My Club</Link>
        <p className="mt-5 text-[10px] font-black tracking-[.25em] text-[#ed5266]">YOUR CONTRIBUTIONS</p>
        <h1>Reputation history</h1>
        <p>A transparent record of how your Club reputation grows.</p>
      </header>
      {error ? <div className="empty-state" role="alert">{error}</div> : null}
      {loading ? <div className="empty-state" role="status">Loading your activity…</div> : data ? <>
        <section className="stats-grid">
          <div><strong>{data.xp.toLocaleString("en-NG")}</strong><small>Current XP</small></div>
          <div><strong>{data.activeEvents.toLocaleString("en-NG")}</strong><small>Active events</small></div>
        </section>
        <section className="membership-row">
          <div><strong>{data.rank?.name ?? "New Face"}</strong><small className="block text-white/50">Current Club rank</small></div>
          <ArrowUpRight className="text-[#ed5266]"/>
        </section>
        <div className="queue-heading"><h2>Recent activity</h2><span>{data.events.length} records</span></div>
        <section className="admin-member-list">
          {data.events.map((event) => (
            <article key={event.id} className="!items-center">
              <div className="admin-member-avatar"><Clock3 size={16}/></div>
              <div className="admin-member-info">
                <strong>{event.label}</strong>
                <small>{new Date(event.createdAt).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" })}</small>
                {event.status === "REVERSED" ? <small className="text-rose-300">Reversed by moderation</small> : null}
              </div>
              <strong className={event.status === "REVERSED" ? "text-white/35 line-through" : "text-emerald-300"}>{event.points > 0 ? "+" : ""}{event.points} XP</strong>
            </article>
          ))}
          {!data.events.length ? <div className="empty-state">Your verified contributions will appear here.</div> : null}
        </section>
      </> : null}
      <p className="selection-hint">Only verified server-side activity earns XP. Daily and per-action limits help prevent farming.</p>
      <nav className="bottom-nav">
        <Link href="/club">⌂<small>Home</small></Link><Link href="/discover">◉<small>Discover</small></Link>
        <Link className="create-button" href="/club/create">＋</Link><Link href="/chats">▢<small>Chats</small></Link>
        <Link className="active" href="/my-club">♙<small>My Club</small></Link>
      </nav>
    </main>
  );
}
