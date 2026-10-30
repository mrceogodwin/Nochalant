import React, { useEffect, useState } from "react";

export default function SocialFeed({ currentUser, onJoin, onShare }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/opinions", { headers: { Accept: "application/json" }, cache: "no-store" })
      .then(async response => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data.ok) throw new Error(data.error || "The community feed is temporarily unavailable.");
        if (active) setItems(Array.isArray(data.opinions) ? data.opinions : []);
      })
      .catch(err => { if (active) setError(err.message || "Could not load the community feed."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return <div className="social-feed-shell">
    <div className="social-feed-heading">
      <div><span className="eyebrow">THE PEOPLE · THE CONVERSATION</span><h2 id="social-title">Nochalant <em>Social.</em></h2><p>Community takes on music, entertainment, lifestyle and the culture.</p></div>
      <button className="button button-green" type="button" onClick={onShare}>＋ Share your take</button>
    </div>
    <div className="social-feed-layout">
      <div className="social-feed-list">
        {loading ? <div className="social-feed-state">Loading the community conversation…</div> : error ? <div className="social-feed-state" role="status">{error}</div> : items.length ? items.map(item => <article className="social-post" key={item.id}>
          <div className="social-post-top"><span className="social-avatar">{(item.author_name || "N").trim().slice(0,1).toUpperCase()}</span><div><strong>{item.author_name || "Nochalant member"}</strong><small>{item.topic || "Culture"} · Community opinion</small></div><span className="social-post-brand">NOCHALANT</span></div>
          <p className="social-post-body">{item.body}</p>
          <div className="social-post-foot"><span>Published community opinion</span><span>Respect the conversation</span></div>
        </article>) : <div className="social-feed-state"><strong>The conversation starts here.</strong><p>Approved community opinions will appear here once members start sharing.</p><button className="button button-outline" type="button" onClick={onShare}>Be the first to share</button></div>}
      </div>
      <aside className="social-feed-aside"><span className="social-aside-mark">N<span>.</span></span><h3>Your voice belongs in the culture.</h3><p>Share your perspective. Keep it respectful. Help shape the conversation.</p>{currentUser ? <button className="button button-outline full-width" type="button" onClick={onShare}>Write an opinion</button> : <button className="button button-green full-width" type="button" onClick={onJoin}>Join the conversation</button>}</aside>
    </div>
  </div>;
}
