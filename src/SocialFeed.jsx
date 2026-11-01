import React, { useEffect, useState } from "react";
import { getAuthToken } from "./auth.js";

export default function SocialFeed({ currentUser, onJoin, onLogin, onShare }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    if (!currentUser?.id) {
      setItems([]);
      setError("");
      setLoading(false);
      return () => { active = false; controller.abort(); };
    }

    setLoading(true);
    setError("");
    (async () => {
      try {
        const token = await getAuthToken();
        if (!token) throw new Error("Your session has expired. Please sign in again.");
        const response = await fetch("/api/social/feed", {
          signal: controller.signal,
          headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
          cache: "no-store"
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data.ok) throw new Error(data.error || "The social feed is temporarily unavailable.");
        if (active) setItems(Array.isArray(data.posts) ? data.posts : []);
      } catch (err) {
        if (active && err?.name !== "AbortError") setError(err.message || "Could not load Nochalant Social.");
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => { active = false; controller.abort(); };
  }, [currentUser?.id]);

  if (!currentUser?.id) {
    return <div className="social-feed-shell social-member-gate">
      <div className="social-feed-heading">
        <div><span className="eyebrow">NOCHALANT · MEMBERS ONLY</span><h2 id="social-title">Your people. <em>Your space.</em></h2><p>Nochalant Social is a private community for registered members.</p></div>
        <span className="social-aside-mark" aria-hidden="true">N<span>.</span></span>
      </div>
      <div className="social-feed-state"><strong>Come inside the culture.</strong><p>Create a free Nochalant account or sign in to discover people, share your perspective and join conversations.</p><div className="social-member-gate-actions"><button className="button button-green" type="button" onClick={onJoin}>Create your account</button><button className="button button-outline" type="button" onClick={onLogin}>Sign in</button></div></div>
    </div>;
  }

  return <div className="social-feed-shell">
    <div className="social-feed-heading">
      <div><span className="eyebrow">THE PEOPLE · THE CONVERSATION</span><h2 id="social-title">Nochalant <em>Social.</em></h2><p>Community takes on music, entertainment, lifestyle and the culture.</p></div>
      <button className="button button-green" type="button" onClick={onShare}>＋ Share your take</button>
    </div>
    <div className="social-feed-layout">
      <div className="social-feed-list">
        {loading ? <div className="social-feed-state">Loading your community conversation…</div> : error ? <div className="social-feed-state" role="status">{error}</div> : items.length ? items.map(item => <article className="social-post" key={item.id}>
          <div className="social-post-top"><span className="social-avatar">{(item.author_name || "N").trim().slice(0,1).toUpperCase()}</span><div><strong>{item.author_name || "Nochalant member"}</strong><small>{item.topic || "Culture"} · Community opinion</small></div><span className="social-post-brand">NOCHALANT</span></div>
          <p className="social-post-body">{item.body}</p>
          <div className="social-post-foot"><span>Published community opinion</span><span>Respect the conversation</span></div>
        </article>) : <div className="social-feed-state"><strong>The conversation starts here.</strong><p>Approved community opinions will appear here once members start sharing.</p><button className="button button-outline" type="button" onClick={onShare}>Be the first to share</button></div>}
      </div>
      <aside className="social-feed-aside"><span className="social-aside-mark">N<span>.</span></span><h3>Your voice belongs in the culture.</h3><p>Share your perspective. Keep it respectful. Help shape the conversation.</p><button className="button button-outline full-width" type="button" onClick={onShare}>Write an opinion</button></aside>
    </div>
  </div>;
}
