"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type NotificationItem = { id: string; type: string; payload: unknown; readAt: string | null; createdAt: string };

export default function NotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/notifications", { cache: "no-store" })
      .then(async response => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Notifications could not be loaded.");
        if (active) setItems(result.notifications || []);
      })
      .catch(e => { if (active) setError(e instanceof Error ? e.message : "Notifications unavailable."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function markAllRead() {
    const ids = items.filter(item => !item.readAt).map(item => item.id);
    if (!ids.length || busy) return;
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ notificationIds: ids }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not update notifications.");
      const now = new Date().toISOString();
      setItems(current => current.map(item => ids.includes(item.id) ? { ...item, readAt: now } : item));
    } catch (e) { setError(e instanceof Error ? e.message : "Could not update notifications."); }
    finally { setBusy(false); }
  }

  function details(item: NotificationItem) {
    const payload = item.payload && typeof item.payload === "object" ? item.payload as Record<string, unknown> : {};
    if (typeof payload.conversationId === "string") return `/chats/conversation/${payload.conversationId}`;
    return "/chats";
  }

  return <main className="feed-shell">
    <header className="chat-header"><Link href="/club">‹</Link><div><strong>Notifications</strong><small>Your Club activity</small></div><button className="group-more" onClick={markAllRead} disabled={busy || !items.some(item => !item.readAt)}>{busy ? "…" : "Mark read"}</button></header>
    <div className="queue-heading"><h2>Recent activity</h2><span className="selection-hint">{items.filter(item => !item.readAt).length} unread</span></div>
    {loading ? <div className="empty-state">Loading notifications…</div> : error && !items.length ? <div className="empty-state"><strong>Notifications unavailable</strong><p>{error}</p></div> : <div className="notification-list">
      {items.map(item => <Link href={details(item)} className={item.readAt ? "notification-item" : "notification-item unread"} key={item.id}><span className="notification-icon">{item.type === "MESSAGE" ? "✉" : "✦"}</span><div><strong>{item.type === "MESSAGE" ? "New message" : item.type.replaceAll("_"," ").toLowerCase()}</strong><p>{item.type === "MESSAGE" ? "You have a new direct message." : "There is new activity in your Club."}</p><small>{new Intl.DateTimeFormat(undefined,{dateStyle:"medium",timeStyle:"short"}).format(new Date(item.createdAt))}</small></div>{!item.readAt&&<i/>}</Link>)}
      {!items.length&&<div className="empty-state"><strong>You’re all caught up.</strong><p>New activity will appear here.</p></div>}
    </div>}
    {error&&items.length>0&&<p role="alert" className="form-error">{error}</p>}
    <Link href="/club" className="yellow-cta link-cta">Back to the feed <span>→</span></Link>
  </main>;
}
