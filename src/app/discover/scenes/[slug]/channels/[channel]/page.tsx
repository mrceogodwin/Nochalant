"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import NochalantKeyboard from "@/components/NochalantKeyboard";

type ChannelPost = {
  id: string; body: string; createdAt: string;
  author: { id: string; username: string; displayName: string; profile: { avatarUrl: string | null } | null } | null;
};
type ChannelPayload = { channel: { name: string; description: string | null }; posts: ChannelPost[] };

export default function ChannelPage({ params }: { params: Promise<{ slug: string; channel: string }> }) {
  const { slug, channel } = use(params);
  const [draft, setDraft] = useState("");
  const [posts, setPosts] = useState<ChannelPost[]>([]);
  const [channelName, setChannelName] = useState(channel);
  const [description, setDescription] = useState("Join the conversation and share with your Scene.");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function loadPosts() {
    const response = await fetch(`/api/scenes/${encodeURIComponent(slug)}/channels/${encodeURIComponent(channel)}/posts`, { cache: "no-store" });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Channel conversations could not be loaded.");
    const payload = result as ChannelPayload;
    setPosts(payload.posts || []);
    setChannelName(payload.channel.name);
    setDescription(payload.channel.description || "Join the conversation and share with your Scene.");
  }

  useEffect(() => {
    let active = true;
    fetch(`/api/scenes/${encodeURIComponent(slug)}/channels/${encodeURIComponent(channel)}/posts`, { cache: "no-store" })
      .then(async response => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Channel conversations could not be loaded.");
        if (active) {
          const payload = result as ChannelPayload;
          setPosts(payload.posts || []);
          setChannelName(payload.channel.name);
          setDescription(payload.channel.description || "Join the conversation and share with your Scene.");
        }
      })
      .catch(e => { if (active) setError(e instanceof Error ? e.message : "Unable to load this channel."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [slug, channel]);

  async function sendMessage() {
    const body = draft.trim();
    if (!body || busy) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const response = await fetch(`/api/scenes/${encodeURIComponent(slug)}/channels/${encodeURIComponent(channel)}/posts`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Your message could not be posted.");
      setDraft("");
      await loadPosts();
      setNotice("Your message was published to this Scene channel.");
    } catch (e) { setError(e instanceof Error ? e.message : "Your message could not be posted."); }
    finally { setBusy(false); }
  }

  function formatTime(value: string) {
    return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
  }

  return <main className="feed-shell">
    <header className="chat-header">
      <Link href={`/discover/scenes/${slug}/channels`}>‹</Link>
      <div><strong>#{channelName}</strong><small>Scene channel</small></div>
      <Link className="group-more" href={`/discover/scenes/${slug}/manage`}>•••</Link>
    </header>
    <section className="channel-conversation-head">
      <span>✦</span><h1>#{channelName}</h1><p>{description}</p>
      <small>Be part of the conversation. Keep it thoughtful.</small>
    </section>
    {loading ? <div className="empty-state">Loading conversations…</div> : error && !posts.length ? <div className="empty-state"><strong>Channel unavailable</strong><p>{error}</p><button onClick={() => { setLoading(true); setError(""); loadPosts().catch(e => setError(e.message)).finally(() => setLoading(false)); }}>Try again</button></div> : <div className="channel-posts">
      {posts.length ? posts.map(post => (
        <article className="channel-post" key={post.id}>
          <span className="group-message-avatar">{(post.author?.displayName || "M").slice(0, 1).toUpperCase()}</span>
          <div><small><b>{post.author?.displayName || "Club member"}</b> · {formatTime(post.createdAt)}</small><p>{post.body}</p></div>
        </article>
      )) : <div className="empty-state"><strong>The conversation starts here.</strong><p>Be the first to share something with this Scene.</p></div>}
    </div>}
    {notice && <div role="status" className="feed-notice">{notice}<button onClick={() => setNotice("")}>×</button></div>}
    {error && posts.length > 0 && <p role="alert" className="form-error">{error}</p>}
    <NochalantKeyboard value={draft} onChange={setDraft} onSubmit={sendMessage} placeholder={"Message #" + channelName + "..."} />
    {busy && <p className="selection-hint">Publishing…</p>}
    <p className="selection-hint channel-disclaimer">Messages are saved to the Scene channel. Only members with access can read them.</p>
  </main>;
}
