"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Award, Lock, ShieldCheck } from "lucide-react";

type BadgeItem = {
  id: string;
  name: string;
  description: string;
  rarity: string;
  artworkPath: string;
  earned: boolean;
  revoked: boolean;
  earnedAt: string | null;
  progress: number;
  progressLabel: string;
};

const rarityLabels: Record<string, string> = {
  COMMON: "Common",
  UNCOMMON: "Uncommon",
  RARE: "Rare",
  EPIC: "Epic",
  LEGENDARY: "Legendary",
  FOUNDERS_EDITION: "Founders Edition",
};

export default function BadgeCollection() {
  const [badges, setBadges] = useState<BadgeItem[]>([]);
  const [filter, setFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/me/badges", { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to load your achievements.");
        return data.badges as BadgeItem[];
      })
      .then((data) => { if (active) setBadges(data ?? []); })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : "Unable to load your achievements.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const earnedCount = badges.filter((badge) => badge.earned).length;
  const visible = useMemo(() => badges.filter((badge) => {
    if (filter === "EARNED") return badge.earned;
    if (filter === "LOCKED") return !badge.earned && !badge.revoked;
    if (filter === "REVOKED") return badge.revoked;
    return true;
  }), [badges, filter]);

  return (
    <main className="feed-shell">
      <header className="screen-heading">
        <Link href="/my-club" className="selection-hint inline-flex items-center gap-2"><ArrowLeft size={15}/> My Club ID</Link>
        <p className="mt-5 text-[10px] font-black tracking-[.25em] text-[#ed5266]">YOUR SYMBOL. YOUR STORY.</p>
        <h1>Achievements & badges</h1>
        <p>Earn recognition through real participation in the Club.</p>
      </header>

      <section className="membership-row" aria-label="Achievement progress">
        <div className="w-full">
          <div className="flex items-center justify-between gap-3">
            <strong>{earnedCount} of {badges.length} earned</strong>
            <span className="selection-hint">{badges.length ? Math.round(earnedCount / badges.length * 100) : 0}% complete</span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-[#ed2939]" style={{ width: `${badges.length ? earnedCount / badges.length * 100 : 0}%` }} />
          </div>
        </div>
      </section>

      <div className="feed-tabs discover-filters" aria-label="Filter achievements">
        {[
          ["ALL", "All"],
          ["EARNED", "Earned"],
          ["LOCKED", "In progress"],
          ["REVOKED", "Revoked"],
        ].map(([value, label]) => (
          <button key={value} className={filter === value ? "selected" : ""} onClick={() => setFilter(value)}>{label}</button>
        ))}
      </div>

      {error ? <div className="empty-state" role="alert">{error}</div> : null}
      {loading ? <div className="empty-state" role="status">Loading your achievements…</div> : (
        <div className="identity-icon-grid">
          {visible.map((badge) => (
            <article key={badge.id} className={`identity-icon-card ${badge.earned ? "is-selected" : ""} ${badge.revoked ? "opacity-55" : ""}`}>
              <span className="identity-icon-art">
                <svg viewBox="0 0 64 64" role="img" aria-label={badge.name}><use href={badge.artworkPath}/></svg>
              </span>
              <strong>{badge.name}</strong>
              <small>{rarityLabels[badge.rarity] ?? badge.rarity.replaceAll("_", " ")}</small>
              <span className={badge.earned ? "identity-owned" : "identity-locked"}>
                {badge.earned ? "Earned" : badge.revoked ? "Revoked" : "In progress"}
              </span>
              <p className="text-[10px] leading-relaxed text-white/45">{badge.description}</p>
              {badge.earned ? (
                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-300"><ShieldCheck size={12}/> {badge.earnedAt ? new Date(badge.earnedAt).toLocaleDateString() : "Unlocked"}</span>
              ) : badge.revoked ? (
                <span className="inline-flex items-center gap-1 text-[10px] text-rose-300"><Lock size={12}/> Moderation action</span>
              ) : (
                <>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-[#ed5266]" style={{ width: `${badge.progress}%` }}/></div>
                  <small>{badge.progressLabel}</small>
                </>
              )}
            </article>
          ))}
        </div>
      )}
      {!loading && !error && visible.length === 0 ? <div className="empty-state"><Award size={22}/> No badges in this filter yet.</div> : null}
      <p className="selection-hint">Badges are awarded from verified activity. Paid memberships and purchases do not grant achievement badges.</p>
      <nav className="bottom-nav">
        <Link href="/club">⌂<small>Home</small></Link>
        <Link href="/discover">◉<small>Discover</small></Link>
        <Link className="create-button" href="/club/create">＋</Link>
        <Link href="/chats">▢<small>Chats</small></Link>
        <Link className="active" href="/my-club">♙<small>My Club</small></Link>
      </nav>
    </main>
  );
}
