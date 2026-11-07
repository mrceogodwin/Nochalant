"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import NochalantKeyboard from "@/components/NochalantKeyboard";

type ChatMessage = {
  id: string; senderId: string; body: string | null; createdAt: string;
  sender: { id: string; username: string; displayName: string; profile: { avatarUrl: string | null } | null };
};

export default function SquadChatPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function load() {
    const response = await fetch(`/api/squads/${encodeURIComponent(slug)}/chat`, { cache: "no-store" });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Squad chat could not be loaded.");
    setMessages(result.messages || []);
  }

  useEffect(() => {
    let active = true;
    fetch(`/api/squads/${encodeURIComponent(slug)}/chat`, { cache: "no-store" })
      .then(async response => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Squad chat could not be loaded.");
        if (active) setMessages(result.messages || []);
      })
      .catch(e => { if (active) setError(e instanceof Error ? e.message : "Unable to load Squad chat."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [slug]);

  async function send() {
    const body = draft.trim();
    if (!body || busy) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const response = await fetch(`/api/squads/${encodeURIComponent(slug)}/chat`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body, clientMessageId: crypto.randomUUID() }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Message could not be sent.");
      setDraft("");
      await load();
      setNotice("Message sent to your Squad.");
    } catch (e) { setError(e instanceof Error ? e.message : "Message could not be sent."); }
    finally { setBusy(false); }
  }

  return <main className="feed-shell">
    <header className="chat-header"><Link href={`/squads/${slug}`}>‹</Link><div><strong>Squad chat</strong><small>Members-only conversation</small></div><Link className="group-more" href={`/squads/${slug}`}>•••</Link></header>
    {loading ? <div className="empty-state">Loading messages…</div> : error && !messages.length ? <div className="empty-state"><strong>Chat unavailable</strong><p>{error}</p><button onClick={() => { setLoading(true); setError(""); load().catch(e => setError(e.message)).finally(() => setLoading(false)); }}>Try again</button></div> : <div className="channel-posts">
      {messages.length ? messages.map(message => <article className="channel-post" key={message.id}><span className="group-message-avatar">{message.sender.displayName.slice(0,1).toUpperCase()}</span><div><small><b>{message.sender.displayName}</b> · {new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(message.createdAt))}</small><p>{message.body}</p></div></article>) : <div className="empty-state"><strong>Start your Squad conversation.</strong><p>Say hello and bring everyone into the discussion.</p></div>}
    </div>}
    {notice && <div role="status" className="feed-notice">{notice}</div>}
    {error && messages.length > 0 && <p role="alert" className="form-error">{error}</p>}
    <NochalantKeyboard value={draft} onChange={setDraft} onSubmit={send} placeholder="Message your Squad…" />
    {busy && <p className="selection-hint">Sending…</p>}
    <p className="selection-hint channel-disclaimer">Only current Squad members can access this conversation.</p>
  </main>;
}
