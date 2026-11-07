"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";

type Scene = {
  id: string; name: string; slug: string; description: string; category: string;
  coverUrl: string | null; visibility: "PUBLIC" | "PRIVATE" | "PAID" | "UNLISTED";
  memberCount: number; rules?: unknown; channels?: { id: string; name: string; slug: string; description: string | null; isDefault: boolean }[];
};
type Membership = { status: string; role: string; joinedAt?: string } | null;
type Payload = { scene: Scene; membership: Membership; access: "MEMBER" | "PUBLIC" | "RESTRICTED" };

export default function SceneDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [data, setData] = useState<Payload | null>(null);
  const [tab, setTab] = useState("Overview");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [pendingMembers, setPendingMembers] = useState<{ userId: string; joinedAt: string; user: { username: string; displayName: string; profile: { avatarUrl: string | null } | null } }[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  async function loadScene() {
    const response = await fetch(`/api/scenes/${encodeURIComponent(slug)}`, { cache: "no-store" });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Scene could not be loaded.");
    setData(result as Payload);
  }
  useEffect(() => {
    let active = true;
    fetch(`/api/scenes/${encodeURIComponent(slug)}`, { cache: "no-store" })
      .then(async response => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Scene could not be loaded.");
        if (active) setData(result as Payload);
      })
      .catch(error => { if (active) setError(error instanceof Error ? error.message : "Scene could not be loaded."); });
    return () => { active = false; };
  }, [slug]);

  async function changeMembership(action: "join" | "leave") {
    setBusy(true); setNotice(""); setError("");
    try {
      const response = await fetch(`/api/scenes/${encodeURIComponent(slug)}${action === "join" ? "/join" : ""}`, { method: action === "join" ? "POST" : "DELETE" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to update membership.");
      setNotice(result.message || "Membership updated.");
      await loadScene();
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to update membership."); }
    finally { setBusy(false); }
  }

  async function loadPendingMembers() {
    setLoadingMembers(true); setError("");
    try {
      const response = await fetch(`/api/scenes/${encodeURIComponent(slug)}/members`, { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Member requests are unavailable.");
      setPendingMembers(result.pending || []);
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to load requests."); }
    finally { setLoadingMembers(false); }
  }

  async function decideRequest(userId: string, action: "APPROVE" | "REJECT") {
    setBusy(true); setError(""); setNotice("");
    try {
      const response = await fetch(`/api/scenes/${encodeURIComponent(slug)}/members`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, action }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to update request.");
      setNotice(result.message); await loadPendingMembers(); await loadScene();
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to update request."); }
    finally { setBusy(false); }
  }

  if (error && !data) return <main className="feed-shell"><Link href="/discover">‹ Discover</Link><p role="alert" className="form-error">{error}</p></main>;
  if (!data) return <main className="feed-shell"><p className="supporting">Loading Scene…</p></main>;
  const { scene, membership, access } = data;
  const isMember = access === "MEMBER";
  const isPending = membership?.status === "PENDING";
  const isManager = isMember && ["FOUNDER", "CO_FOUNDER", "CURATOR", "MODERATOR"].includes(membership?.role || "");
  const rules = Array.isArray(scene.rules) ? scene.rules.filter((v): v is string => typeof v === "string") : [];

  return <main className="feed-shell">
    <header className="chat-header"><Link href="/discover">‹</Link><div><strong>{scene.name}</strong><small>Scene community</small></div>{isManager && <Link href={`/discover/scenes/${slug}/manage`} className="group-more">Manage</Link>}</header>
    <section className="scene-detail-art"><span>NOCHALANT SCENE · {scene.category.toUpperCase()}</span><h1>{scene.name}</h1><small>{scene.visibility.toLowerCase()} Scene</small></section>
    <div className="scene-detail-meta"><strong>{scene.memberCount.toLocaleString()} members</strong><span>{scene.visibility === "PRIVATE" ? "Approval required" : "Community"}</span></div>
    <p className="scene-detail-description">{scene.description}</p>
    <div className="scene-member-actions">
      {isMember ? <button className="yellow-cta" disabled={busy || membership?.role === "FOUNDER"} onClick={() => changeMembership("leave")}>{busy ? "Please wait…" : membership?.role === "FOUNDER" ? "Scene founder" : "Leave Scene"}</button>
      : isPending ? <button className="yellow-cta" disabled>Request pending</button>
      : access === "RESTRICTED" ? <button className="yellow-cta" disabled>Private Scene</button>
      : <button className="yellow-cta" disabled={busy} onClick={() => changeMembership("join")}>{busy ? "Please wait…" : scene.visibility === "PRIVATE" ? "Request to join" : "Join Scene +"}</button>}
      <span>{isMember ? membership?.role.replace("_", " ") : isPending ? "Awaiting approval" : "Discover and connect"}</span>
    </div>
    {notice && <p role="status" className="feed-notice">{notice}</p>}
    {error && <p role="alert" className="form-error">{error}</p>}
    {access === "RESTRICTED" ? <div className="owner-notice"><strong>Private community</strong><p>You can see this Scene's introduction. Its channels and member content are only available after a moderator approves your request.</p></div> : <>
      <div className="scene-detail-tabs">{["Overview", "Channels", "Members", "About"].map(t => <button key={t} className={tab === t ? "selected" : ""} onClick={() => { setTab(t); if (t === "Members" && isManager) loadPendingMembers(); }}>{t}</button>)}</div>
      {tab === "Overview" && <><div className="scene-section-head"><h2>Community channels</h2><button onClick={() => setTab("Channels")}>View all →</button></div>{(scene.channels || []).map(channel => <div className="scene-channel-row" key={channel.id}><span>✦</span><div><b>#{channel.name}</b><small>{channel.description || "Scene conversation"}</small></div></div>)}{!scene.channels?.length && <p className="selection-hint">No channels have been created yet.</p>}</>}
      {tab === "Channels" && (scene.channels || []).map(channel => <div className="scene-channel-row" key={channel.id}><span>✦</span><div><b>#{channel.name}</b><small>{channel.description || "Scene conversation"}</small></div></div>)}
      {tab === "Members" && <><div className="queue-heading"><h2>Membership</h2><span>{scene.memberCount} ACTIVE</span></div>{isManager ? <><button className="text-back" onClick={loadPendingMembers} disabled={loadingMembers}>{loadingMembers ? "Refreshing…" : "Refresh requests"}</button>{pendingMembers.length ? pendingMembers.map(person => <div className="group-member-row" key={person.userId}><span>{person.user.displayName.slice(0, 1).toUpperCase()}</span><div><b>{person.user.displayName}</b><small>@{person.user.username} · Request pending</small></div><button disabled={busy} onClick={() => decideRequest(person.userId, "APPROVE")}>Approve</button><button disabled={busy} onClick={() => decideRequest(person.userId, "REJECT")}>Decline</button></div>) : <p className="selection-hint">No pending membership requests.</p>}</> : <p className="selection-hint">Join this Scene to become part of its member community.</p>}</>}
      {tab === "About" && <><div className="queue-heading"><h2>Community guidelines</h2></div><div className="scene-rules">{(rules.length ? rules : ["Respect every member and their boundaries.", "No harassment, hate or targeted abuse.", "Respect creators and share responsibly."]).map((rule, i) => <p key={rule}><b>{i + 1}</b>{rule}</p>)}</div><p className="selection-hint">Scene membership and access are managed by the server.</p></>}
    </>}
  </main>;
}
