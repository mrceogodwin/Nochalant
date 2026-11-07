"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import NochalantKeyboard from "@/components/NochalantKeyboard";

type Message = { id: string; senderId: string; body: string | null; createdAt: string; sender: { id: string; username: string; displayName: string; profile: { avatarUrl: string | null } | null } };

export default function DirectConversationPage({ params }: { params: Promise<{ conversationId: string }> }) {
  const { conversationId } = use(params);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [peerName, setPeerName] = useState("Conversation");
  const [currentUserId, setCurrentUserId] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    const response = await fetch(`/api/conversations/${encodeURIComponent(conversationId)}/messages`, { cache: "no-store" });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Messages could not be loaded.");
    setMessages(result.messages || []);
    if (result.messages?.length) {
      const other = result.messages.find((message: Message) => message.senderId !== result.currentUserId);
      if (other) setPeerName(other.sender.displayName);
    }
    if (result.currentUserId) setCurrentUserId(result.currentUserId);
  }

  useEffect(() => {
    let active = true;
    fetch(`/api/conversations/${encodeURIComponent(conversationId)}/messages`, { cache: "no-store" })
      .then(async response => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Messages could not be loaded.");
        if (active) {
          setMessages(result.messages || []);
          setCurrentUserId(result.currentUserId || "");
          const other = (result.messages || []).find((message: Message) => message.senderId !== result.currentUserId);
          if (other) setPeerName(other.sender.displayName);
        }
      })
      .catch(e => { if (active) setError(e instanceof Error ? e.message : "Unable to load this conversation."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [conversationId]);

  async function send() {
    const body = draft.trim();
    if (!body || busy) return;
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/conversations/${encodeURIComponent(conversationId)}/messages`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body, clientMessageId: crypto.randomUUID() }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Message could not be sent.");
      setDraft("");
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Message could not be sent."); }
    finally { setBusy(false); }
  }

  return <main className="feed-shell chat-screen">
    <header className="chat-header"><Link href="/chats">‹</Link><span className="chat-avatar">{peerName.slice(0,1).toUpperCase()}</span><div><strong>{peerName}</strong><small>Direct conversation</small></div></header>
    {loading ? <div className="empty-state">Loading messages…</div> : error && !messages.length ? <div className="empty-state"><strong>Conversation unavailable</strong><p>{error}</p></div> : <div className="chat-messages">
      {messages.length ? messages.map(message=><article className={message.senderId===currentUserId?"group-message mine":"group-message"} key={message.id}>{message.senderId!==currentUserId&&<span className="group-message-avatar">{message.sender.displayName.slice(0,1).toUpperCase()}</span>}<div className="group-message-content"><small>{message.senderId===currentUserId?"You":message.sender.displayName} · {new Intl.DateTimeFormat(undefined,{hour:"numeric",minute:"2-digit"}).format(new Date(message.createdAt))}</small><p>{message.body}</p></div></article>) : <div className="empty-state"><strong>Say hello.</strong><p>Your conversation starts with the first message.</p></div>}
    </div>}
    {error && messages.length>0 && <p role="alert" className="form-error">{error}</p>}
    <NochalantKeyboard value={draft} onChange={setDraft} onSubmit={send} placeholder="Write a message…"/>
    {busy&&<p className="selection-hint">Sending…</p>}
  </main>;
}
