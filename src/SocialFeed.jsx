import React, { useCallback, useEffect, useState } from "react";
import { getAuthToken } from "./auth.js";

async function socialRequest({ method = "GET", query = "", body, signal }) {
  const token = await getAuthToken();
  if (!token) throw new Error("Your session has expired. Please sign in again.");
  const response = await fetch("/api/social" + query, {
    method,
    signal,
    cache: "no-store",
    headers: {
      Accept: "application/json",
      Authorization: "Bearer " + token,
      ...(body ? { "Content-Type": "application/json" } : {})
    },
    ...(body ? { body: JSON.stringify(body) } : {})
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.ok) throw new Error(data.error || "Nochalant Social is temporarily unavailable.");
  return data;
}

function initials(name) {
  return String(name || "N").trim().split(/\s+/).slice(0, 2).map(part => part[0] || "").join("").toUpperCase() || "N";
}

function timeAgo(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Just now";
  const minutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return minutes + "m";
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return hours + "h";
  const days = Math.floor(hours / 24);
  return days < 7 ? days + "d" : date.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

export default function SocialFeed({ currentUser, onJoin, onLogin }) {
  const [feed, setFeed] = useState("for-you");
  const [posts, setPosts] = useState([]);
  const [stories, setStories] = useState([]);
  const [storyComposerOpen, setStoryComposerOpen] = useState(false);
  const [storyDraft, setStoryDraft] = useState("");
  const [storyVisibility, setStoryVisibility] = useState("public");
  const [storyPosting, setStoryPosting] = useState(false);
  const [activeStory, setActiveStory] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profile, setProfile] = useState(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileDraft, setProfileDraft] = useState({ displayName: "", username: "", bio: "", websiteUrl: "", location: "", avatarUrl: "" });
  const [viewerProfileId, setViewerProfileId] = useState("");
  const [suggestedMembers, setSuggestedMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [composerOpen, setComposerOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [visibility, setVisibility] = useState("public");
  const [posting, setPosting] = useState(false);
  const [notice, setNotice] = useState("");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [expandedComments, setExpandedComments] = useState({});
  const [comments, setComments] = useState({});
  const [commentDrafts, setCommentDrafts] = useState({});
  const [busyAction, setBusyAction] = useState("");

  const loadFeed = useCallback(async (signal) => {
    setLoading(true);
    setError("");
    try {
      const data = await socialRequest({ query: "?feed=" + feed, signal });
      setViewerProfileId(data.viewerProfileId || "");
      setPosts(Array.isArray(data.posts) ? data.posts : []);
      setSuggestedMembers(Array.isArray(data.suggestedMembers) ? data.suggestedMembers : []);
      const storyData = await socialRequest({ query: "?stories=1", signal });
      setStories(Array.isArray(storyData.stories) ? storyData.stories : []);
    } catch (err) {
      if (err?.name !== "AbortError") setError(err.message || "Could not load Nochalant Social.");
    } finally {
      setLoading(false);
    }
  }, [feed]);

  useEffect(() => {
    if (!currentUser?.id) {
      setPosts([]);
      setSuggestedMembers([]);
      return undefined;
    }
    const controller = new AbortController();
    loadFeed(controller.signal);
    return () => controller.abort();
  }, [currentUser?.id, loadFeed]);

  const createPost = async (event) => {
    event.preventDefault();
    const body = draft.trim();
    if (!body || posting) return;
    setPosting(true);
    setNotice("");
    try {
      await socialRequest({ method: "POST", body: { action: "create_post", body, visibility } });
      setDraft("");
      setComposerOpen(false);
      setFeed("for-you");
      await loadFeed();
      setNotice("Your post is live.");
    } catch (err) {
      setNotice(err.message || "Your post could not be published.");
    } finally {
      setPosting(false);
    }
  };

  const toggleLike = async (post) => {
    const key = "like:" + post.id;
    if (busyAction) return;
    setBusyAction(key);
    try {
      const data = await socialRequest({ method: "POST", body: { action: "toggle_like", postId: post.id } });
      setPosts(items => items.map(item => item.id === post.id
        ? { ...item, viewer_liked: data.liked, like_count: Math.max(0, Number(item.like_count || 0) + (data.liked ? 1 : -1)) }
        : item));
    } catch (err) { setNotice(err.message); }
    finally { setBusyAction(""); }
  };

  const toggleComments = async (post) => {
    const opening = !expandedComments[post.id];
    setExpandedComments(value => ({ ...value, [post.id]: opening }));
    if (opening && !comments[post.id]) {
      try {
        const data = await socialRequest({ query: "?commentsFor=" + encodeURIComponent(post.id) });
        setComments(value => ({ ...value, [post.id]: data.comments || [] }));
      } catch (err) { setNotice(err.message); }
    }
  };

  const submitComment = async (event, post) => {
    event.preventDefault();
    const body = String(commentDrafts[post.id] || "").trim();
    if (!body || busyAction) return;
    setBusyAction("comment:" + post.id);
    try {
      const data = await socialRequest({ method: "POST", body: { action: "comment", postId: post.id, body } });
      setComments(value => ({ ...value, [post.id]: [...(value[post.id] || []), data.comment] }));
      setCommentDrafts(value => ({ ...value, [post.id]: "" }));
      setPosts(items => items.map(item => item.id === post.id ? { ...item, comment_count: Number(item.comment_count || 0) + 1 } : item));
    } catch (err) { setNotice(err.message); }
    finally { setBusyAction(""); }
  };

  const openProfile = async () => {
    setProfileOpen(true);
    try {
      const data = await socialRequest({ query: "?profile=1" });
      const value = data.profile || {};
      setProfile(value);
      setProfileDraft({
        displayName: value.display_name || currentUser?.name || "",
        username: value.username || "",
        bio: value.bio || "",
        websiteUrl: value.website_url || "",
        location: value.location || "",
        avatarUrl: value.avatar_url || ""
      });
    } catch (err) { setNotice(err.message); }
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    if (profileSaving) return;
    setProfileSaving(true);
    try {
      const data = await socialRequest({ method: "POST", body: { action: "update_profile", ...profileDraft } });
      setProfile(data.profile);
      setProfileDraft(value => ({ ...value, displayName: data.profile.display_name }));
      setNotice("Your profile has been updated.");
      setProfileOpen(false);
    } catch (err) { setNotice(err.message); }
    finally { setProfileSaving(false); }
  };

  const createStory = async (event) => {
    event.preventDefault();
    const body = storyDraft.trim();
    if (!body || storyPosting) return;
    setStoryPosting(true);
    try {
      const data = await socialRequest({ method: "POST", body: { action: "create_story", body, visibility: storyVisibility } });
      setStories(items => [data.story, ...items]);
      setStoryDraft("");
      setStoryComposerOpen(false);
      setActiveStory(data.story);
      setNotice("Your story is live for 24 hours.");
    } catch (err) { setNotice(err.message); }
    finally { setStoryPosting(false); }
  };

  const openStory = async (story) => {
    setActiveStory(story);
    if (!story.viewer_seen) {
      try {
        await socialRequest({ method: "POST", body: { action: "view_story", storyId: story.id } });
        setStories(items => items.map(item => item.id === story.id ? { ...item, viewer_seen: true, view_count: Number(item.view_count || 0) + 1 } : item));
      } catch (err) { setNotice(err.message); }
    }
  };

  const openNotifications = async () => {
    const opening = !notificationsOpen;
    setNotificationsOpen(opening);
    if (!opening) return;
    setNotificationsLoading(true);
    try {
      const data = await socialRequest({ query: "?notifications=1" });
      setNotifications(Array.isArray(data.notifications) ? data.notifications : []);
    } catch (err) { setNotice(err.message); }
    finally { setNotificationsLoading(false); }
  };

  const markNotificationRead = async (notification) => {
    if (notification.read_at) return;
    try {
      await socialRequest({ method: "POST", body: { action: "mark_notification_read", notificationId: notification.id } });
      setNotifications(items => items.map(item => item.id === notification.id ? { ...item, read_at: new Date().toISOString() } : item));
    } catch (err) { setNotice(err.message); }
  };

  const toggleFollow = async (member) => {
    if (busyAction) return;
    const key = "follow:" + member.id;
    setBusyAction(key);
    try {
      await socialRequest({ method: "POST", body: { action: "follow", targetUserId: member.id } });
      setSuggestedMembers(items => items.filter(item => item.id !== member.id));
      setPosts(items => items.map(item => item.author_id === member.id ? { ...item, viewer_follows_author: true } : item));
      setNotice("You're now following " + member.display_name + ".");
    } catch (err) { setNotice(err.message); }
    finally { setBusyAction(""); }
  };

  if (!currentUser?.id) {
    return <div className="social-feed-shell social-member-gate">
      <div className="social-feed-heading">
        <div><span className="eyebrow">NOCHALANT · MEMBERS ONLY</span><h2 id="social-title">Your people. <em>Your space.</em></h2><p>A home for the voices, creators and conversations shaping culture.</p></div>
        <span className="social-aside-mark" aria-hidden="true">N<span>.</span></span>
      </div>
      <div className="social-feed-state"><strong>Come inside the culture.</strong><p>Create a free Nochalant account or sign in to discover people, share your perspective and join conversations.</p><div className="social-member-gate-actions"><button className="button button-green" type="button" onClick={onJoin}>Create your account</button><button className="button button-outline" type="button" onClick={onLogin}>Sign in</button></div></div>
    </div>;
  }

  return <div className="social-feed-shell">
    <header className="social-network-header">
      <div><span className="eyebrow">THE PEOPLE · THE CULTURE</span><h1 id="social-title">Nochalant <em>Social.</em></h1><p>What's happening in your world?</p></div>
      <button className="social-create-top" type="button" onClick={() => setComposerOpen(true)} aria-label="Create a post">＋ <span>Create post</span></button>
      <button className="social-profile-top" type="button" onClick={openProfile}>Profile</button>
      <button className="social-notification-toggle" type="button" onClick={openNotifications} aria-expanded={notificationsOpen} aria-label="Notifications">🔔<span>Notifications</span></button>
    </header>

    {suggestedMembers.length > 0 && <section className="social-people-rail" aria-label="People to follow">
      <div className="social-rail-heading"><div><span className="eyebrow">FIND YOUR PEOPLE</span><h2>Creators & community</h2></div><span>MEMBERS TO DISCOVER</span></div>
      <div className="social-people-list">
        {suggestedMembers.map(member => <article className="social-person" key={member.id}>
          <span className="social-person-avatar">{initials(member.display_name)}</span>
          <strong title={member.display_name}>{member.display_name}</strong>
          <small>{String(member.account_type || "fan").replaceAll("_", " ")}</small>
          <button type="button" onClick={() => toggleFollow(member)} disabled={busyAction === "follow:" + member.id}>＋ Follow</button>
        </article>)}
      </div>
    </section>}

    <section className="social-stories-rail" aria-label="Stories">
      <button type="button" className="social-story-bubble social-story-add" onClick={() => setStoryComposerOpen(true)}>
        <span className="social-story-avatar">＋</span><strong>Your story</strong>
      </button>
      {stories.map(story => <button type="button" className={"social-story-bubble" + (story.viewer_seen ? " seen" : "")} key={story.id} onClick={() => openStory(story)}>
        <span className="social-story-avatar">{initials(story.author_name)}</span><strong>{story.author_name || "Member"}</strong>
      </button>)}
    </section>

    <div className="social-feed-toolbar">
      <div className="social-feed-tabs" role="tablist" aria-label="Choose your feed">
        <button type="button" role="tab" aria-selected={feed === "for-you"} className={feed === "for-you" ? "active" : ""} onClick={() => setFeed("for-you")}>For you</button>
        <button type="button" role="tab" aria-selected={feed === "following"} className={feed === "following" ? "active" : ""} onClick={() => setFeed("following")}>Following</button>
      </div>
      <span className="social-feed-live"><i/> COMMUNITY FEED</span>
    </div>

    {notificationsOpen && <section className="social-notification-panel" aria-label="Notifications">
      <div className="social-notification-panel-head"><strong>Notifications</strong><button type="button" onClick={() => setNotificationsOpen(false)} aria-label="Close notifications">×</button></div>
      {notificationsLoading ? <p className="social-notification-empty">Loading notifications…</p> : notifications.length ? notifications.map(item => <button type="button" className={"social-notification-item" + (item.read_at ? "" : " unread")} key={item.id} onClick={() => markNotificationRead(item)}>
        <i/><span><strong>{item.title}</strong><small>{item.body}</small><em>{timeAgo(item.created_at)}</em></span>
      </button>) : <p className="social-notification-empty">You're all caught up. New follows and replies will appear here.</p>}
    </section>}
    {notice && <div className="social-notice" role="status"><span>{notice}</span><button type="button" onClick={() => setNotice("")} aria-label="Dismiss notice">×</button></div>}

    {storyComposerOpen && <div className="social-composer-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget && !storyPosting) setStoryComposerOpen(false); }}>
      <form className="social-composer social-story-composer" onSubmit={createStory}>
        <div className="social-composer-head"><div><span className="eyebrow">24 HOURS · NOCHALANT STORIES</span><h2>Add to your story</h2></div><button type="button" onClick={() => setStoryComposerOpen(false)} aria-label="Close story composer">×</button></div>
        <textarea value={storyDraft} onChange={event => setStoryDraft(event.target.value)} maxLength={500} rows={5} placeholder="A quick thought, update or moment…" required/>
        <div className="social-composer-bottom"><label>Audience <select value={storyVisibility} onChange={event => setStoryVisibility(event.target.value)}><option value="public">Everyone</option><option value="followers">Followers only</option></select></label><span>{storyDraft.length}/500</span><button className="button button-green" type="submit" disabled={!storyDraft.trim() || storyPosting}>{storyPosting ? "Publishing…" : "Share story"}</button></div>
        <p className="social-story-media-note">Text stories are enabled. Photo and video stories will be enabled after secure upload, scanning and moderation are ready.</p>
      </form>
    </div>}

    {activeStory && <div className="social-composer-backdrop social-story-viewer" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setActiveStory(null); }}>
      <article className="social-story-card"><div className="social-story-viewer-top"><span className="social-story-avatar">{initials(activeStory.author_name)}</span><div><strong>{activeStory.author_name}</strong><small>Expires {new Date(activeStory.expires_at).toLocaleString()}</small></div><button type="button" onClick={() => setActiveStory(null)} aria-label="Close story">×</button></div><p>{activeStory.body}</p><small>{Number(activeStory.view_count || 0).toLocaleString()} views</small></article>
    </div>}

    {profileOpen && <div className="social-composer-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget && !profileSaving) setProfileOpen(false); }}>
      <form className="social-composer social-profile-editor" onSubmit={saveProfile}>
        <div className="social-composer-head"><div><span className="eyebrow">YOUR NOCHALANT IDENTITY</span><h2>Edit profile</h2></div><button type="button" onClick={() => setProfileOpen(false)} aria-label="Close profile editor">×</button></div>
        <label>Display name<input value={profileDraft.displayName} onChange={event => setProfileDraft(v => ({ ...v, displayName: event.target.value }))} maxLength={80} required/></label>
        <label>Username<input value={profileDraft.username} onChange={event => setProfileDraft(v => ({ ...v, username: event.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "") }))} minLength={3} maxLength={24} pattern="[a-z0-9_]{3,24}" placeholder="yourname" required/><small>3–24 letters, numbers or underscores.</small></label>
        <label>Bio<textarea value={profileDraft.bio} onChange={event => setProfileDraft(v => ({ ...v, bio: event.target.value }))} maxLength={280} rows={3} placeholder="Tell people a little about yourself."/></label>
        <label>Website<input type="url" value={profileDraft.websiteUrl} onChange={event => setProfileDraft(v => ({ ...v, websiteUrl: event.target.value }))} placeholder="https://example.com"/></label>
        <label>Location<input value={profileDraft.location} onChange={event => setProfileDraft(v => ({ ...v, location: event.target.value }))} maxLength={100} placeholder="City, country"/></label>
        <label>Avatar image URL<input type="url" value={profileDraft.avatarUrl} onChange={event => setProfileDraft(v => ({ ...v, avatarUrl: event.target.value }))} placeholder="https://…"/></label>
        <button className="button button-green" type="submit" disabled={profileSaving}>{profileSaving ? "Saving…" : "Save profile"}</button>
      </form>
    </div>}

    {composerOpen && <div className="social-composer-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget && !posting) setComposerOpen(false); }}>
      <form className="social-composer" onSubmit={createPost} aria-label="Create a post">
        <div className="social-composer-head"><div><span className="eyebrow">START A CONVERSATION</span><h2>Create a post</h2></div><button type="button" onClick={() => setComposerOpen(false)} aria-label="Close composer">×</button></div>
        <div className="social-composer-author"><span className="social-avatar">{initials(currentUser.name || currentUser.displayName || currentUser.email)}</span><div><strong>{currentUser.name || currentUser.displayName || "You"}</strong><small>Posting to Nochalant Social</small></div></div>
        <textarea value={draft} onChange={event => setDraft(event.target.value)} maxLength={10000} rows={6} placeholder="What's happening in the culture? Share your take…" autoFocus required/>
        <div className="social-composer-bottom"><label>Audience <select value={visibility} onChange={event => setVisibility(event.target.value)}><option value="public">Everyone</option><option value="followers">Followers only</option></select></label><span>{draft.length.toLocaleString()} / 10,000</span><button className="button button-green" type="submit" disabled={!draft.trim() || posting}>{posting ? "Publishing…" : "Publish post"}</button></div>
      </form>
    </div>}

    <div className="social-network-layout">
      <main className="social-network-posts">
        {loading ? <div className="social-feed-state">Loading your community…</div> : error ? <div className="social-feed-state" role="alert"><strong>We couldn't load the feed.</strong><p>{error}</p><button className="button button-outline" onClick={() => loadFeed()}>Try again</button></div> : posts.length ? posts.map(post => <article className="social-network-post" key={post.id}>
          <div className="social-network-post-head"><span className="social-avatar">{initials(post.author_name)}</span><div className="social-author-copy"><strong>{post.author_name || "Nochalant member"}</strong><small>{String(post.account_type || "fan").replaceAll("_", " ")} · {timeAgo(post.created_at)}</small></div>{post.author_id !== viewerProfileId && <span className="social-member-label">{post.viewer_follows_author ? "FOLLOWING" : "NOCHALANT"}</span>}</div>
          <p className="social-network-post-body">{post.body}</p>
          <div className="social-network-post-actions">
            <button type="button" className={post.viewer_liked ? "liked" : ""} onClick={() => toggleLike(post)} disabled={busyAction === "like:" + post.id} aria-label={post.viewer_liked ? "Unlike post" : "Like post"}><span>{post.viewer_liked ? "♥" : "♡"}</span>{Number(post.like_count || 0).toLocaleString()} <small>Likes</small></button>
            <button type="button" onClick={() => toggleComments(post)} aria-expanded={!!expandedComments[post.id]}><span>▢</span>{Number(post.comment_count || 0).toLocaleString()} <small>Comments</small></button>
            <span className="social-post-visibility">{post.visibility === "followers" ? "FOLLOWERS" : "PUBLIC"}</span>
          </div>
          {expandedComments[post.id] && <section className="social-comments">
            {(comments[post.id] || []).map(comment => <article className="social-comment" key={comment.id}><span className="social-comment-avatar">{initials(comment.author_name)}</span><div><strong>{comment.author_name}</strong><p>{comment.body}</p><small>{timeAgo(comment.created_at)}</small></div></article>)}
            <form onSubmit={event => submitComment(event, post)} className="social-comment-form"><input value={commentDrafts[post.id] || ""} onChange={event => setCommentDrafts(value => ({ ...value, [post.id]: event.target.value }))} maxLength={4000} placeholder="Write a reply…" aria-label="Write a reply"/><button type="submit" disabled={!(commentDrafts[post.id] || "").trim() || busyAction === "comment:" + post.id}>Reply</button></form>
          </section>}
        </article>) : <div className="social-feed-state"><strong>{feed === "following" ? "Your Following feed is quiet." : "The conversation starts here."}</strong><p>{feed === "following" ? "Follow creators and members to see their posts here." : "Be among the first to share what's happening in your world."}</p><button className="button button-green" type="button" onClick={() => setComposerOpen(true)}>＋ Create your first post</button></div>}
      </main>
      <aside className="social-network-aside">
        <div className="social-aside-card"><span className="social-aside-mark">N<span>.</span></span><span className="eyebrow">NOCHALANT SOCIAL</span><h2>Your voice moves culture.</h2><p>Connect with creators, artists and people shaping entertainment, music and everyday life.</p><button type="button" className="button button-outline full-width" onClick={() => setComposerOpen(true)}>Start a conversation</button></div>
        <div className="social-aside-note"><strong>Keep it respectful.</strong><p>Build the culture. Credit creators. Make room for different voices.</p></div>
      </aside>
    </div>

    <button className="social-floating-create" type="button" onClick={() => setComposerOpen(true)} aria-label="Create a post">＋</button>
  </div>;
}
