import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const categories = ["All Gist", "Afrobeats & Jamz", "Nollywood Drama", "BBNaija / Reality", "Fashion & Swag", "Street Buzz", "Lifestyle", "Agenda"];
const submissionCategories = ["Lifestyle", "Clubs & Nightlife", "Entertainment", "Music", "Nollywood", "Street Buzz", "Business", "Agenda"];
const demoStories = [
  { id: "lead", category: "Afrobeats & Jamz", label: "EDITORIAL PREVIEW", title: "The sound, the scene and the next wave of Afrobeats", excerpt: "A closer look at the artists, releases and creative energy shaping the conversation.", image: "https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=1400&q=85", time: "Preview story", views: "—", read: "3 min read", body: "This is a sample editorial layout used to demonstrate how a Nochalant feature story will appear. Replace this preview with a fact-checked story, original reporting, approved images and a named editorial byline before publication." },
  { id: "nollywood", category: "Nollywood Drama", label: "EDITORIAL PREVIEW", title: "The conversations shaping Nollywood right now", excerpt: "From new productions to the people behind the camera, here is the culture worth following.", image: "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=1000&q=85", time: "Preview", views: "—", read: "4 min read", body: "Sample article content. No real celebrity claim or breaking-news headline is being presented here." },
  { id: "street", category: "Street Buzz", label: "EDITORIAL PREVIEW", title: "The city is outside: style, sound and street culture", excerpt: "The places, people and moments giving the city its own rhythm.", image: "https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=1000&q=85", time: "Preview", views: "—", read: "2 min read", body: "Sample article content. No real event details are being advertised here." },
  { id: "fashion", category: "Fashion & Swag", label: "EDITORIAL PREVIEW", title: "The looks bringing a fresh perspective to Naija style", excerpt: "A style desk preview for fashion, personal expression and emerging creatives.", image: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1000&q=85", time: "Preview", views: "—", read: "3 min read", body: "Sample article content for the Nochalant fashion desk." },
  { id: "reality", category: "BBNaija / Reality", label: "EDITORIAL PREVIEW", title: "Reality TV, fan culture and the conversations after the show", excerpt: "A place for reality entertainment coverage, reactions and verified updates.", image: "https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?auto=format&fit=crop&w=1000&q=85", time: "Preview", views: "—", read: "3 min read", body: "Sample article content for the reality desk." },
  { id: "life", category: "Lifestyle", label: "EDITORIAL PREVIEW", title: "The everyday culture shaping how we live and link up", excerpt: "Lifestyle, food, places and experiences from across the culture.", image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1000&q=85", time: "Preview", views: "—", read: "2 min read", body: "Sample article content for the lifestyle desk." }
];

function App() {
  const [category, setCategory] = useState("All Gist");
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState("");
  const [story, setStory] = useState(demoStories[0]);
  const [vote, setVote] = useState("");
  const [likes, setLikes] = useState({});
  const modalCloseRef = useRef(null);
  const previouslyFocusedRef = useRef(null);
  const [comments, setComments] = useState({});
  const [commentDraft, setCommentDraft] = useState("");
  const [toast, setToast] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);
  const audioRef = useRef(null);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioCurrent, setAudioCurrent] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioVolume, setAudioVolume] = useState(0.8);
  const [audioError, setAudioError] = useState(false);
  const [formCategory, setFormCategory] = useState("Afrobeats & Jamz");
  const [leadSlide, setLeadSlide] = useState(0);
  const [carouselPaused, setCarouselPaused] = useState(false);
  const [leadVideoPlaying, setLeadVideoPlaying] = useState(false);
  const leadVideoRef = useRef(null);
  const leadSlides = [
    { story: demoStories[0], type: "image" },
    { story: demoStories[2], type: "image" },
    { story: demoStories[3], type: "image" },
    { story: demoStories[4], type: "video", video: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4" }
  ];
  useEffect(() => {
    if (carouselPaused || leadVideoPlaying) return;
    const timer = window.setInterval(() => setLeadSlide(current => (current + 1) % leadSlides.length), 5500);
    return () => window.clearInterval(timer);
  }, [carouselPaused, leadVideoPlaying, leadSlides.length]);
  const changeLeadSlide = (index) => {
    if (leadVideoRef.current) { leadVideoRef.current.pause(); leadVideoRef.current.currentTime = 0; }
    setLeadVideoPlaying(false);
    setLeadSlide((index + leadSlides.length) % leadSlides.length);
  };

  const formatAudioTime = (seconds) => {
    if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
  };
  const toggleAudio = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!audio.paused) {
      audio.pause();
      return;
    }
    try {
      setAudioError(false);
      await audio.play();
    } catch {
      setAudioPlaying(false);
      setAudioError(true);
      notify("Audio could not start. Check your connection and try again.");
    }
  };
  const seekAudio = (event) => {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(audio.duration)) return;
    const nextTime = Number(event.target.value);
    audio.currentTime = nextTime;
    setAudioCurrent(nextTime);
  };
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = audioVolume;
    const updateTime = () => setAudioCurrent(audio.currentTime || 0);
    const updateDuration = () => setAudioDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
    const onPlay = () => { setAudioPlaying(true); setAudioError(false); };
    const onPause = () => setAudioPlaying(false);
    const onEnded = () => setAudioPlaying(false);
    const onError = () => { setAudioPlaying(false); setAudioError(true); };
    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("durationchange", updateDuration);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);
    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("durationchange", updateDuration);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
    };
  }, [audioVolume]);

  const filtered = useMemo(() => demoStories.slice(1).filter(item =>
    (category === "All Gist" || item.category === category) &&
    (item.title.toLowerCase().includes(search.toLowerCase()) || item.excerpt.toLowerCase().includes(search.toLowerCase()))
  ), [category, search]);

  const notify = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 3000);
  };
  const openStory = (item) => { setStory(item); setCommentDraft(""); setModal("story"); };
  const closeModal = () => setModal("");
  useEffect(() => {
    if (!modal) return;
    previouslyFocusedRef.current = document.activeElement;
    const onKey = (event) => { if (event.key === "Escape") closeModal(); };
    window.addEventListener("keydown", onKey);
    requestAnimationFrame(() => modalCloseRef.current?.focus());
    return () => {
      window.removeEventListener("keydown", onKey);
      previouslyFocusedRef.current?.focus?.();
    };
  }, [modal]);

  const submitGist = (event) => {
    event.preventDefault();
    notify("Preview only: your gist has not been sent or saved. Submission services are not connected yet.");
  };
  const toggleLike = (id) => setLikes(current => ({ ...current, [id]: !current[id] }));
  const addComment = (event) => {
    event.preventDefault();
    if (!commentDraft.trim()) return;
    setComments(current => ({ ...current, [story.id]: [...(current[story.id] || []), commentDraft.trim()] }));
    setCommentDraft("");
    notify("Comment added to this local preview.");
  };

  return <div className="site-shell">
    <div className="ticker"><span className="ticker-label">GOBE ALERT</span><div className="ticker-window"><div className="ticker-track"><span>🔥 NO DEY FORM, JUST PURE GIST</span><span>🇳🇬 YOUR CULTURE. YOUR PEOPLE. YOUR BUZZ.</span><span>✳ FREE DAILY SUBMISSIONS</span><span>📍 WHAT'S HAPPENING? CHECK THE AGENDA</span><span>🔥 NO DEY FORM, JUST PURE GIST</span><span>🇳🇬 YOUR CULTURE. YOUR PEOPLE. YOUR BUZZ.</span></div></div></div>
    <header className="site-header"><div className="nav-wrap">
      <a className="brand" href="#top">NOCHALANT<span>.</span><small>NO DEY FORM, JUST PURE GIST 🇳🇬</small></a>
      <button className="menu-toggle" onClick={() => setMobileMenu(!mobileMenu)} aria-label="Toggle navigation">☰</button>
      <nav className={mobileMenu ? "main-nav open" : "main-nav"}><a href="#latest" onClick={() => setMobileMenu(false)}>Latest gist</a><a href="#categories" onClick={() => setMobileMenu(false)}>Categories</a><a href="#hot-or-trash" onClick={() => setMobileMenu(false)}>Hot or Trash</a><a href="#agenda" onClick={() => setMobileMenu(false)}>Agenda</a></nav>
      <div className="nav-actions"><button className="text-button nav-login" onClick={() => setModal("login")}>Log in</button><button className="nav-spill" onClick={() => setModal("submit")}><span>Spill the tea</span></button><button className="nav-join" onClick={() => setModal("signup")}><span>Join Nochalant</span><span className="nav-join-arrow" aria-hidden="true">↗</span></button></div>
    </div></header>

    <main id="top">
      <section className="container lead-layout">
        <div className="lead-copy"><div className="eyebrow"><span className="live-dot"></span> THE CULTURE DESK · EDITORIAL PREVIEW</div>
          <h1>Worry no more.<br/><em>Nochalant is here.</em></h1>
          <p>Your plug for Nigerian entertainment, music, nightlife, lifestyle and everything happening around you. No long talk — just the gist that matters.</p>
          <div className="hero-actions"><button className="button button-green" onClick={() => setModal("submit")}>Spill the gist ↗</button><a className="button button-outline" href="#latest">Catch up on gist</a></div>
          
        </div>
        <article className="lead-story" aria-label="Featured Nochalant carousel" onMouseEnter={() => setCarouselPaused(true)} onMouseLeave={() => setCarouselPaused(false)}>
          {leadSlides.map((slide, index) => <div className={index === leadSlide ? "lead-slide active" : "lead-slide"} key={slide.story.id} aria-hidden={index !== leadSlide}>
            {slide.type === "video" ? <video ref={leadVideoRef} className="lead-media" src={slide.video} poster={slide.story.image} controls playsInline preload="none" onPlay={() => setLeadVideoPlaying(true)} onPause={() => setLeadVideoPlaying(false)} onEnded={() => {setLeadVideoPlaying(false); changeLeadSlide(0);}} onClick={e => e.stopPropagation()} aria-label="Video preview player"/> : <img className="lead-media" src={slide.story.image} alt={slide.story.title}/>}
            <div className="lead-overlay"></div>
            <div className="lead-story-top"><span className="pill pill-hot">{slide.type === "video" ? "▶ VIDEO PREVIEW" : "✦ HOT DROP"}</span><span className="demo-label">EDITORIAL PREVIEW</span></div>
            <div className="lead-story-bottom"><div className="story-meta"><span>{slide.story.category}</span><span>· {slide.story.read}</span></div><h2>{slide.story.title}</h2><p>{slide.story.excerpt}</p><div className="lead-actions"><button onClick={e => {e.stopPropagation(); openStory(slide.story);}}>Read story ↗</button><b>{index + 1} / {leadSlides.length}</b></div></div>
          </div>)}
          <div className="lead-carousel-controls">
            <button className="lead-carousel-arrow" aria-label="Previous featured slide" onClick={e => {e.stopPropagation();changeLeadSlide(leadSlide-1);}}>‹</button>
            <div className="lead-carousel-dots">{leadSlides.map((slide,index)=><button key={slide.story.id} className={index===leadSlide?"active":""} aria-label={`Go to featured slide ${index+1}`} aria-current={index===leadSlide?"true":undefined} onClick={e=>{e.stopPropagation();changeLeadSlide(index);}}/>)}</div>
            <button className="lead-carousel-arrow" aria-label="Next featured slide" onClick={e => {e.stopPropagation();changeLeadSlide(leadSlide+1);}}>›</button>
          </div>
        </article>article>
      </section>

      <section className="container value-strip"><div><span className="value-icon">↗</span><div><b>Free daily submissions</b><small>Share your news, music, brand or event.</small></div></div><div><span className="value-icon gold">✦</span><div><b>Carousel placement</b><small>Optional premium feature · ₦5,999.</small></div></div><div><span className="value-icon">◷</span><div><b>Editorial review</b><small>Every post is checked before publishing.</small></div></div></section>

      <section className="section container" id="latest"><div className="section-heading"><div><div className="eyebrow">FRESH FROM THE CULTURE</div><h2>Latest <em>crispy gist.</em></h2></div><span className="demo-label">SAMPLE CONTENT · NOT LIVE NEWS</span></div>
        <div className="filter-row" id="categories"><div className="category-tabs">{categories.map(item => <button key={item} className={category === item ? "category-tab active" : "category-tab"} onClick={() => setCategory(item)}>{item}</button>)}</div><label className="search-box"><span aria-hidden="true">⌕</span><input aria-label="Search stories" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search the gist"/></label></div>
        <div className="story-grid">{filtered.map(item => <article className="story-card" key={item.id} role="button" tabIndex="0" aria-label={`Open story: ${item.title}`} onClick={() => openStory(item)} onKeyDown={e => e.key === "Enter" && e.target === e.currentTarget && openStory(item)}><div className="story-image"><img src={item.image} alt=""/><span className="story-category">{item.category}</span><span className="story-open">↗</span></div><div className="story-content"><div className="story-meta"><span>{item.time}</span><span>{item.read}</span></div><h3>{item.title}</h3><p>{item.excerpt}</p><div className="story-foot"><button className={likes[item.id] ? "like-action liked" : "like-action"} onClick={e => {e.stopPropagation();toggleLike(item.id);}} aria-pressed={!!likes[item.id]}>♡ {likes[item.id] ? "Liked" : "Like"}</button><span>◌ {comments[item.id]?.length || 0} comments</span><b>Full gist ↗</b></div></div></article>)}{filtered.length === 0 && <div className="empty-state">No stories in this category yet. Check back soon.</div>}</div>
      </section>

      <section className="section container split-section" id="hot-or-trash"><div className="jury-image"><img src="https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=1000&q=85" alt="Street fashion editorial"/><span className="image-tag">THE STREET JURY</span></div><div className="jury-panel"><div className="eyebrow">NO BE EVERY TREND WE GO FOLLOW</div><h2>Hot or <em>trash?</em></h2><p>Everybody get opinion. Is this look, sound or trend giving what it should give? Cast your vote.</p><div className="jury-options"><button className={vote === "hot" ? "jury-option hot selected" : "jury-option hot"} onClick={() => setVote("hot")}>🔥 Pure fire</button><button className={vote === "trash" ? "jury-option trash selected" : "jury-option trash"} onClick={() => setVote("trash")}>✕ Off key</button></div><div className="vote-results"><div className="vote-labels"><span>YOUR VIBE CHECK</span><span>{vote ? (vote === "hot" ? "PURE FIRE" : "OFF KEY") : "NO VOTE YET"}</span></div><div className="vote-bar"><i style={{width: vote ? "100%" : "0%"}}/></div></div><small className="muted">{vote ? "Your selection is shown locally only. It has not been counted or saved." : "Cast a preview vote. Live community results will appear when voting is connected."}</small></div></section>

      <section className="agenda-section" id="agenda"><div className="container"><div className="section-heading"><div><div className="eyebrow">THE CITY NEVER SLEEPS</div><h2>What's on the <em>Agenda?</em></h2></div><span className="agenda-note">EVENTS · HANGOUTS · EXPERIENCES</span></div><div className="agenda-empty"><span>✳</span><h3>Your next link-up belongs here.</h3><p>Upcoming events will appear after they are submitted and approved by the Nochalant team.</p><button className="button button-outline" onClick={() => {setFormCategory("Agenda");setModal("submit");}}>Submit an event ↗</button></div></div></section>

      <section className="promo-section container"><div className="promo-copy"><div className="eyebrow">GOT SOMETHING TO SAY?</div><h2>Don't just watch<br/>the buzz. <em>Be the buzz.</em></h2><p>Got a new song, event, club night, brand, talent or lifestyle story? Send it to Nochalant. Free daily submissions are welcome.</p><button className="button button-green" onClick={() => setModal("submit")}>Spill your gist ↗</button></div><div className="pricing-card"><div className="pricing-top"><span className="pill pill-gold">OPTIONAL FEATURE</span><span className="spark">✳</span></div><h3>Get on the <em>carousel.</em></h3><p>Give your promotion a premium spot in the Nochalant spotlight.</p><div className="price">₦5,999 <small>/ placement</small></div><ul><li>Premium carousel consideration</li><li>Editorial review required</li><li>Payment confirmation required</li></ul><button className="button button-dark" onClick={() => {setFormCategory("Afrobeats & Jamz");setModal("submit");}}>Request a placement ↗</button><small className="fine-print">Payment processing is not connected yet. No payment will be collected in this preview.</small></div></section>
    </main>

    <footer className="footer"><div className="container footer-main"><div><a className="brand footer-brand" href="#top">NOCHALANT<span>.</span></a><p>No Dey Form, Just Pure Gist 🇳🇬<br/>Worry no more, Nochalant is here.</p></div><div className="footer-links"><a href="#latest">Latest gist</a><a href="#categories">Categories</a><a href="#agenda">Agenda</a><button onClick={() => setModal("submit")}>Submit gist</button><a href="mailto:hello@nochalant.com">Contact</a></div></div><div className="container footer-bottom"><span>© 2026 Nochalant. All rights reserved.</span><span>Made for the culture. 🇳🇬</span><span className="footer-credit">Powered by Squadglobal.</span></div></footer>

    <audio ref={audioRef} preload="metadata" src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" />
    <section className="mini-player" aria-label="Nochalant audio player">
      <span className={audioPlaying ? "mini-player-icon spinning" : "mini-player-icon"} aria-hidden="true">♫</span>
      <div className="player-main">
        <div className="player-title"><b>Nochalant Player</b><small>{audioError ? "Audio unavailable — tap retry" : "Demo track · Replace with licensed audio"}</small></div>
        <div className="player-progress">
          <span>{formatAudioTime(audioCurrent)}</span>
          <input aria-label="Seek audio" type="range" min="0" max={audioDuration || 0} step="0.1" value={Math.min(audioCurrent, audioDuration || 0)} onChange={seekAudio} disabled={!audioDuration} />
          <span>{formatAudioTime(audioDuration)}</span>
        </div>
      </div>
      <button className="player-toggle" onClick={toggleAudio} aria-label={audioPlaying ? "Pause audio" : "Play audio"}>{audioPlaying ? "Ⅱ" : "▶"}</button>
      <label className="player-volume" aria-label="Volume"><span>♪</span><input type="range" min="0" max="1" step="0.05" value={audioVolume} onChange={e => setAudioVolume(Number(e.target.value))}/></label>
      <span className={audioError ? "player-status error" : "player-status"}>{audioError ? "ERROR" : audioPlaying ? "PLAYING" : "READY"}</span>
    </section>

    {modal && <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && closeModal()}><div className="modal-card" role="dialog" aria-modal="true" aria-labelledby="modal-title"><button ref={modalCloseRef} className="modal-close" onClick={closeModal} aria-label="Close dialog">×</button>
      {modal === "story" && <><span className="eyebrow">{story.category} · {story.label}</span><h2 id="modal-title">{story.title}</h2><img className="modal-story-image" src={story.image} alt=""/><p>{story.body}</p><div className="comment-area"><h3>Join the conversation</h3>{(comments[story.id] || []).map((comment, index) => <p className="comment" key={index}>{comment}</p>)}<form onSubmit={addComment}><label className="sr-only" htmlFor="comment-input">Your comment</label><textarea id="comment-input" rows="3" value={commentDraft} onChange={e => setCommentDraft(e.target.value)} placeholder="Drop your comment..."/><button className="button button-green" type="submit">Post comment</button></form><small className="fine-print">Comments are stored only in this browser preview.</small></div></>}
      {modal === "submit" && <><span className="eyebrow">YOUR STORY. YOUR PLATFORM.</span><h2 id="modal-title">Spill the <em>gist.</em></h2><p className="modal-intro">Send your story for editorial review. Submissions are not published automatically.</p><form onSubmit={submitGist}><label>Your name<input required placeholder="Name or brand name"/></label><label>Email address<input required type="email" placeholder="you@example.com"/></label><label>Category<select value={submissionCategories.includes(formCategory) ? formCategory : "Entertainment"} onChange={e => setFormCategory(e.target.value)}>{submissionCategories.map(x => <option key={x} value={x}>{x}</option>)}</select></label><label>Post title<input required maxLength="120" placeholder="Give your gist a clear title"/></label><label>Tell us the full gist<textarea required rows="5" placeholder="Add details, links and useful context..."/></label><label className="check-label"><input type="checkbox" required/> I confirm this submission is accurate and I have permission to share its content.</label><button className="button button-green full-width" type="submit">Test submission form ↗</button><small className="fine-print">Submission storage, duplicate checks and account login are not connected yet. This preview does not send your information to a server.</small></form></>}
      {(modal === "signup" || modal === "login") && <><span className="eyebrow">JOIN THE CULTURE</span><h2 id="modal-title">{modal === "signup" ? "Create your account." : "Welcome back."}</h2><p className="modal-intro">Account registration and login will be enabled when secure authentication is connected.</p><form onSubmit={e => {e.preventDefault();notify("Authentication is not connected in this preview.");closeModal();}}>{modal === "signup" && <label>Full name<input required placeholder="Your name"/></label>}<label>Email address<input type="email" required placeholder="you@example.com"/></label><label>Password<input type="password" required minLength="8" placeholder="At least 8 characters"/></label><button className="button button-green full-width" type="submit">{modal === "signup" ? "Create account" : "Log in"} ↗</button></form><button className="switch-modal" onClick={() => setModal(modal === "signup" ? "login" : "signup")}>{modal === "signup" ? "Already registered? Log in" : "New here? Register"}</button></>}
    </div></div>}
    {toast && <div className="toast" role="status">{toast}</div>}
  </div>;
}
createRoot(document.getElementById("root")).render(<App />);
