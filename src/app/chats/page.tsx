"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Conversation = {
  id: string;
  peer: { id: string; username: string; displayName: string; profile: { avatarUrl: string | null } | null };
  lastMessage: { body: string | null; createdAt: string; senderId: string } | null;
  lastReadAt: string | null;
};

export default function ChatsPage() {
  const [tab, setTab] = useState("All");
  const [query, setQuery] = useState("");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/conversations", { cache: "no-store" })
      .then(async response => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Could not load conversations.");
        if (active) setConversations(result.conversations || []);
      })
      .catch(e => { if (active) setError(e instanceof Error ? e.message : "Conversations are unavailable."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const filtered = useMemo(() => conversations.filter(item =>
    (item.peer.displayName + " " + item.peer.username + " " + (item.lastMessage?.body || "")).toLowerCase().includes(query.toLowerCase())
  ), [conversations, query]);

  return <main className="feed-shell inbox-shell">
    <header className="inbox-top"><div><p className="onboard-kicker">YOUR CORNER</p><h1>Your Chats<span>.</span></h1><p>Keep your people close.</p></div><Link href="/chats/requests" className="inbox-icon-button" aria-label="Message requests">✉</Link></header>
    <div className="chat-shortcuts"><Link href="/chats/voice-rooms"><span>♫</span><b>Voice rooms</b><small>Discover live rooms</small></Link><Link href="/chats/requests"><span>↗</span><b>Requests</b><small>Message requests</small></Link></div>
    <label className="chat-search">⌕ <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search conversations"/></label>
    <div className="chat-tabs">{["All","Unread","Direct","Group"].map(item=><button key={item} className={tab===item?"selected":""} onClick={()=>setTab(item)}>{item}</button>)}</div>
    {loading ? <div className="empty-state">Loading your conversations…</div> : error ? <div className="empty-state"><strong>Chats unavailable</strong><p>{error}</p><button onClick={()=>window.location.reload()}>Try again</button></div> : <div className="inbox-list">
      {filtered.map(item=><Link href={`/chats/conversation/${item.id}`} className="chat-row" key={item.id}><span className="chat-avatar">{item.peer.displayName.slice(0,1).toUpperCase()}</span><span className="chat-copy"><strong>{item.peer.displayName}</strong><small>{item.lastMessage?.body || "Start a conversation"}</small></span><span className="chat-meta"><time>{item.lastMessage ? new Intl.DateTimeFormat(undefined,{hour:"numeric",minute:"2-digit"}).format(new Date(item.lastMessage.createdAt)) : ""}</time></span></Link>)}
      {!filtered.length&&<div className="empty-state"><strong>No conversations yet</strong><p>When you message another member, your conversation will appear here.</p></div>}
    </div>}
    <p className="selection-hint inbox-note">Your direct conversations are loaded from your Nochalant account.</p>
    <nav className="bottom-nav"><Link href="/club"><span>⌂</span>Home</Link><Link href="/discover"><span>◉</span>Discover</Link><Link className="create-button" href="/club/create"><span>＋</span></Link><Link className="active" href="/chats"><span>▢</span>Chats</Link><Link href="/my-club"><span>♙</span>My Club</Link></nav>
  </main>;
}
