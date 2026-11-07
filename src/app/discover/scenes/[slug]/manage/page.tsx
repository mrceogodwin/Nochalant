"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";

type PendingMember = {
  userId: string;
  joinedAt: string;
  user: { username: string; displayName: string; profile: { avatarUrl: string | null } | null };
};

export default function SceneManage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [pending, setPending] = useState<PendingMember[]>([]);
  const [activeCount, setActiveCount] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function load() {
    const response = await fetch(`/api/scenes/${encodeURIComponent(slug)}/members`, { cache: "no-store" });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "You cannot manage this Scene.");
    setPending(result.pending || []);
    setActiveCount(result.activeCount || 0);
  }

  useEffect(() => { load().catch(e => setError(e.message)); }, [slug]);

  async function decide(userId: string, action: "APPROVE" | "REJECT") {
    setBusy(true); setError(""); setNotice("");
    try {
      const response = await fetch(`/api/scenes/${encodeURIComponent(slug)}/members`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, action }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to update membership.");
      setNotice(result.message); await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to update membership."); }
    finally { setBusy(false); }
  }

  return <main className="feed-shell">
    <header className="chat-header"><Link href={`/discover/scenes/${slug}`}>‹</Link><div><strong>Scene management</strong><small>Founder and moderator tools</small></div></header>
    <section className="scene-manage-hero"><p className="onboard-kicker">COMMUNITY MANAGEMENT</p><h1>Look after<br/><em>your Scene.</em></h1><p>Review membership requests and keep your community welcoming.</p></section>
    <div className="scene-manage-grid">
      <div><span>♙</span><b>{activeCount} members</b><small>Active membership</small></div>
      <div><span>◷</span><b>{pending.length} requests</b><small>Awaiting your decision</small></div>
      <Link href={`/discover/scenes/${slug}/channels`}><span>▤</span><b>Channels</b><small>View conversations</small></Link>
    </div>
    <section className="scene-settings-card"><div className="scene-section-head"><h2>Membership requests</h2><button onClick={() => load().catch(e => setError(e.message))}>Refresh</button></div>
      {pending.length ? pending.map(person => <div className="group-member-row" key={person.userId}><span>{person.user.displayName.slice(0,1).toUpperCase()}</span><div><b>{person.user.displayName}</b><small>@{person.user.username}</small></div><button disabled={busy} onClick={() => decide(person.userId, "APPROVE")}>Approve</button><button disabled={busy} onClick={() => decide(person.userId, "REJECT")}>Decline</button></div>) : <p className="selection-hint">There are no pending requests.</p>}
    </section>
    {notice && <p role="status" className="feed-notice">{notice}</p>}
    {error && <p role="alert" className="form-error">{error}</p>}
    <p className="selection-hint">Only the Scene founder and active co-founders, curators or moderators can manage membership.</p>
  </main>;
}
