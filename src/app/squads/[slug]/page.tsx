"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";

type Member = { role: string; joinedAt: string; user: { id: string; username: string; displayName: string; profile: { avatarUrl: string | null } | null } };
type SquadData = {
  id: string; name: string; slug: string; description: string; isDiscoverable: boolean;
  createdAt: string; isFounder: boolean; membership: { role: string; joinedAt: string } | null;
  _count: { members: number }; founder: Member["user"]; members: Member[];
};

export default function SquadDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [squad, setSquad] = useState<SquadData | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function load() {
    const response = await fetch(`/api/squads/${encodeURIComponent(slug)}`, { cache: "no-store" });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Squad could not be loaded.");
    setSquad(result.squad);
  }

  useEffect(() => {
    let active = true;
    fetch(`/api/squads/${encodeURIComponent(slug)}`, { cache: "no-store" })
      .then(async response => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Squad could not be loaded.");
        if (active) setSquad(result.squad);
      })
      .catch(e => { if (active) setError(e instanceof Error ? e.message : "Unable to load Squad."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [slug]);

  async function membershipAction(action: "JOIN" | "LEAVE") {
    setBusy(true); setError(""); setNotice("");
    try {
      const response = await fetch(`/api/squads/${encodeURIComponent(slug)}`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Membership could not be updated.");
      await load();
      setNotice(action === "JOIN" ? "You joined this Squad." : "You left this Squad.");
    } catch (e) { setError(e instanceof Error ? e.message : "Membership could not be updated."); }
    finally { setBusy(false); }
  }

  if (loading) return <main className="feed-shell"><div className="empty-state">Loading Squad…</div></main>;
  if (!squad) return <main className="feed-shell"><Link href="/squads">‹ Back to Squads</Link><div className="empty-state"><strong>Squad unavailable</strong><p>{error}</p></div></main>;

  const isMember = Boolean(squad.membership) || squad.isFounder;
  return <main className="feed-shell">
    <header className="chat-header"><Link href="/squads">‹</Link><div><strong>{squad.name}</strong><small>{squad.isDiscoverable ? "Discoverable Squad" : "Invite-only Squad"}</small></div><Link className="group-more" href="/squads">•••</Link></header>
    <section className="channel-conversation-head"><span>✦</span><h1>{squad.name}</h1><p>{squad.description}</p><small>{squad._count.members} members · Founded by {squad.founder.displayName}</small></section>
    {notice && <div role="status" className="feed-notice">{notice}</div>}
    {error && <p role="alert" className="form-error">{error}</p>}
    <section className="owner-notice"><strong>{isMember ? "You're part of this Squad" : "Find your people"}</strong><p>{isMember ? "This is your smaller circle. Keep it welcoming and respectful." : "Join this discoverable Squad to become part of the conversation."}</p>
      {squad.isFounder ? <span className="selection-hint">You are the founder</span> : isMember ? <button className="text-back" disabled={busy} onClick={() => membershipAction("LEAVE")}>{busy ? "Updating…" : "Leave Squad"}</button> : <button className="yellow-cta" disabled={busy || !squad.isDiscoverable} onClick={() => membershipAction("JOIN")}>{busy ? "Joining…" : "Join Squad →"}</button>}
    </section>
    <div className="queue-heading"><h2>Members</h2><span className="selection-hint">{squad._count.members}</span></div>
    <div className="scene-list">{squad.members.map(member => <article className="squad-card" key={member.user.id}><span className="squad-mark">{member.user.displayName.slice(0,1).toUpperCase()}</span><div className="scene-info"><strong>{member.user.displayName}</strong><small>@{member.user.username} · {member.role.toLowerCase().replace("_"," ")}</small></div></article>)}</div>
    {!isMember && <p className="selection-hint">Join the Squad to participate. Private Squad invitations are not yet available.</p>}
  </main>;
}
