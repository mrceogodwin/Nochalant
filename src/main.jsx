import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const stories = [
  { id: 1, category: "Afrobeats", title: "The new sound shaping the next wave of Afrobeats", excerpt: "Fresh releases, rising voices and the conversations moving Nigerian music forward.", image: "https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=1000&q=85", time: "Just now", comments: 24 },
  { id: 2, category: "Nollywood", title: "The Nollywood stories everyone will be talking about", excerpt: "A closer look at the films, actors and moments shaping the screen culture.", image: "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=1000&q=85", time: "2 hours ago", comments: 18 },
  { id: 3, category: "Street Buzz", title: "The city is outside: where the weekend energy is", excerpt: "From intimate link-ups to big nights out, catch the pulse of the scene.", image: "https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=1000&q=85", time: "4 hours ago", comments: 41 },
  { id: 4, category: "Lifestyle", title: "Style, culture and the people setting the pace", excerpt: "The looks, places and everyday details defining a new generation.", image: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1000&q=85", time: "Today", comments: 12 },
  { id: 5, category: "Events", title: "The live shows and experiences to put on your agenda", excerpt: "Keep up with upcoming concerts, parties, launches and cultural experiences.", image: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=1000&q=85", time: "Today", comments: 9 },
  { id: 6, category: "Entertainers", title: "Meet the creatives making moves behind the scenes", excerpt: "Artists, creators, hosts and tastemakers worth knowing right now.", image: "https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?auto=format&fit=crop&w=1000&q=85", time: "Yesterday", comments: 33 }
];

const agenda = [
  { day: "08", month: "NOV", title: "The Lagos Sound Experience", type: "Live music", place: "Victoria Island, Lagos", time: "7:00 PM" },
  { day: "14", month: "NOV", title: "The Weekend Link-Up", type: "Nightlife", place: "Lekki Phase 1, Lagos", time: "9:00 PM" },
  { day: "22", month: "NOV", title: "Creative Culture Market", type: "Lifestyle", place: "Ikeja, Lagos", time: "12:00 PM" }
];

const categories = ["All", "Afrobeats", "Nollywood", "Street Buzz", "Lifestyle", "Events", "Entertainers"];

function App() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [vote, setVote] = useState("");
  const [modal, setModal] = useState("");
  const [selectedStory, setSelectedStory] = useState(null);
  const [plan, setPlan] = useState("free");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [toast, setToast] = useState("");
  const [search, setSearch] = useState("");

  const visibleStories = useMemo(() => stories.filter(story =>
    (activeCategory === "All" || story.category === activeCategory) &&
    (story.title.toLowerCase().includes(search.toLowerCase()) || story.category.toLowerCase().includes(search.toLowerCase()))
  ), [activeCategory, search]);

  const showToast = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 3200);
  };

  const openStory = (story) => {
    setSelectedStory(story);
    setModal("story");
  };

  const submitPost = (event) => {
    event.preventDefault();
    showToast(plan === "paid"
      ? "Your carousel request is ready for payment integration."
      : "Your submission form is ready. Editorial queue connection is the next build step.");
    setModal("");
  };

  return (
    <div className="site-shell">
      <div className="ticker">
        <span className="ticker-label">GOBE ALERT</span>
        <div className="ticker-window"><div className="ticker-track">
          <span>🔥 The latest from Nigerian music and entertainment</span><span>👀 Who is making moves this week?</span><span>🎬 Nollywood, culture and everything in between</span><span>📍 Find your next outing in Agenda</span>
        </div></div>
      </div>

      <header className="site-header">
        <div className="nav-wrap">
          <a className="brand" href="#" aria-label="Nochalant home">NOCHALANT<span>.</span><small>YOUR CULTURE. YOUR BUZZ.</small></a>
          <button className="menu-toggle" onClick={() => setMobileMenu(!mobileMenu)} aria-label="Toggle menu">☰</button>
          <nav className={mobileMenu ? "main-nav open" : "main-nav"}>
            <a href="#latest" onClick={() => setMobileMenu(false)}>Latest gist</a>
            <a href="#categories" onClick={() => setMobileMenu(false)}>Explore</a>
            <a href="#agenda" onClick={() => setMobileMenu(false)}>Agenda</a>
            <a href="#how-it-works" onClick={() => setMobileMenu(false)}>Submit a post</a>
          </nav>
          <div className="nav-actions">
            <button className="text-button" onClick={() => setModal("login")}>Log in</button>
            <button className="button button-green button-small" onClick={() => setModal("signup")}>Register <span>↗</span></button>
          </div>
        </div>
      </header>

      <main>
        <section className="hero-section container">
          <div className="hero-copy">
            <div className="eyebrow"><span className="live-dot"></span> THE HOME OF NAIJA CULTURE</div>
            <h1>Worry no more.<br/><em>Nochalant is here.</em></h1>
            <p>Your plug for entertainment, lifestyle, music, nightlife and everything happening around you. Discover the buzz or put your own story out there.</p>
            <div className="hero-actions">
              <button className="button button-green" onClick={() => setModal("submit")}>Spill your gist <span>↗</span></button>
              <a className="button button-outline" href="#latest">Explore the latest</a>
            </div>
            <div className="hero-proof"><div className="proof-avatars"><b>NG</b><b>✦</b><b>+</b></div><span>For the people. By the culture.</span></div>
          </div>
          <div className="hero-visual">
            <div className="hero-image-main"><img src="https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1400&q=90" alt="Crowd enjoying a live music event"/><div className="image-shade"></div><div className="hero-image-caption"><span className="pill pill-hot">THE CULTURE IS LIVE</span><strong>Everything happening.<br/>One place.</strong></div></div>
            <div className="floating-note"><span>✳</span><div><b>Got something?</b><small>Submit it. Let's get it seen.</small></div></div>
            <div className="hero-stamp">NJA<br/>VIBES<br/><span>✳</span></div>
          </div>
        </section>

        <section className="value-strip container">
          <div><span className="value-icon">↗</span><div><b>Free daily submissions</b><small>Put your story forward at no cost.</small></div></div>
          <div><span className="value-icon gold">✦</span><div><b>Premium carousel</b><small>Get featured for ₦5,999.</small></div></div>
          <div><span className="value-icon">◷</span><div><b>Editorial review</b><small>Submissions enter our review queue.</small></div></div>
        </section>

        <section className="section container" id="latest">
          <div className="section-heading"><div><div className="eyebrow">WHAT'S HAPPENING</div><h2>Latest <em>gist & tales</em></h2></div><a href="#categories" className="arrow-link">Explore all stories ↗</a></div>
          <div className="filter-row" id="categories">
            <div className="category-tabs">{categories.map(category => <button key={category} className={activeCategory === category ? "category-tab active" : "category-tab"} onClick={() => setActiveCategory(category)}>{category}</button>)}</div>
            <label className="search-box"><span>⌕</span><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search the buzz"/></label>
          </div>
          <div className="story-grid">
            {visibleStories.map((story, index) => <article className={index === 0 ? "story-card story-featured" : "story-card"} key={story.id} onClick={() => openStory(story)}>
              <div className="story-image"><img src={story.image} alt=""/><span className="story-category">{story.category}</span><span className="story-open">↗</span></div>
              <div className="story-content"><div className="story-meta"><span>{story.time}</span><span>◌ {story.comments} conversations</span></div><h3>{story.title}</h3><p>{story.excerpt}</p></div>
            </article>)}
            {visibleStories.length === 0 && <div className="empty-state">No stories match that search yet. Try another category.</div>}
          </div>
        </section>

        <section className="section container split-section" id="hot-or-trash">
          <div className="jury-image"><img src="https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=1000&q=85" alt="Fashion street style"/><span className="image-tag">THE STREET JURY</span></div>
          <div className="jury-panel"><div className="eyebrow">YOU DECIDE THE VIBE</div><h2>Hot or <em>trash?</em></h2><p>Everybody get opinion. Cast your vote and let the streets decide what's giving and what's not.</p><div className="jury-options"><button className={vote === "hot" ? "jury-option hot selected" : "jury-option hot"} onClick={() => setVote("hot")}>🔥 Pure fire</button><button className={vote === "trash" ? "jury-option trash selected" : "jury-option trash"} onClick={() => setVote("trash")}>✕ Off key</button></div><div className="vote-results"><div className="vote-labels"><span>68% Fire</span><span>32% Off key</span></div><div className="vote-bar"><i style={{width: vote === "hot" ? "72%" : vote === "trash" ? "61%" : "68%"}}></i></div></div><small className="muted">{vote ? "Your vote has been counted in this preview." : "Vote on the conversation."}</small></div>
        </section>

        <section className="section agenda-section" id="agenda">
          <div className="container"><div className="section-heading"><div><div className="eyebrow">SAVE THE DATE</div><h2>What's on the <em>Agenda?</em></h2></div><span className="agenda-note">THE CITY NEVER SLEEPS ✳</span></div>
            <div className="agenda-list">{agenda.map((item, index) => <article className="agenda-item" key={item.title}><div className="agenda-date"><b>{item.day}</b><span>{item.month}</span></div><div className="agenda-details"><span>{item.type}</span><h3>{item.title}</h3><p>⌖ {item.place} <i>·</i> ◷ {item.time}</p></div><button className="agenda-arrow" onClick={() => showToast("Event details and submissions are coming with the Agenda tools.")}>↗</button></article>)}</div>
            <div className="agenda-submit"><span>Hosting something worth knowing?</span><button className="button button-outline" onClick={() => setModal("submit")}>Add to the Agenda ↗</button></div>
          </div>
        </section>

        <section className="promo-section container" id="how-it-works">
          <div className="promo-copy"><div className="eyebrow">YOUR MOMENT. YOUR PLATFORM.</div><h2>Don't just watch<br/>the buzz. <em>Be the buzz.</em></h2><p>Got a new song, event, club night, brand, talent or lifestyle story? Register and send it to Nochalant. Free daily submissions are welcome.</p><button className="button button-green" onClick={() => setModal("submit")}>Submit your post <span>↗</span></button></div>
          <div className="pricing-card"><div className="pricing-top"><span className="pill pill-gold">MORE VISIBILITY</span><span className="spark">✳</span></div><h3>Get on the <em>carousel.</em></h3><p>Give your promotion a premium spot in the Nochalant spotlight.</p><div className="price">₦5,999 <small>/ placement</small></div><ul><li>Premium carousel placement</li><li>Priority review queue</li><li>Editorial approval required</li></ul><button className="button button-dark" onClick={() => {setPlan("paid");setModal("submit");}}>Choose carousel placement ↗</button><small className="fine-print">Placement is subject to content review and payment confirmation.</small></div>
        </section>
      </main>

      <footer className="footer"><div className="container footer-main"><div><a className="brand footer-brand" href="#">NOCHALANT<span>.</span></a><p>Worry no more, Nochalant is here.<br/>Unfiltered Nigerian entertainment, lifestyle and culture.</p></div><div className="footer-links"><a href="#latest">Latest gist</a><a href="#agenda">Agenda</a><a href="#how-it-works">Submit a post</a><button onClick={() => setModal("signup")}>Register</button></div></div><div className="container footer-bottom"><span>© 2026 Nochalant Media. All rights reserved.</span><span>Made for the culture. 🇳🇬</span></div></footer>

      {modal && <div className="modal-backdrop" onMouseDown={e => {if(e.target === e.currentTarget) setModal("");}}><div className="modal-card">
        <button className="modal-close" onClick={() => setModal("")}>×</button>
        {modal === "story" && selectedStory && <><span className="eyebrow">{selectedStory.category} · {selectedStory.time}</span><h2>{selectedStory.title}</h2><img className="modal-story-image" src={selectedStory.image} alt=""/><p>{selectedStory.excerpt}</p><p className="muted">This is a starter editorial preview. Full article publishing and reader conversations will be connected to the content system.</p></>}
        {modal === "submit" && <><span className="eyebrow">PUT YOUR STORY OUT THERE</span><h2>Submit to <em>Nochalant.</em></h2><p className="modal-intro">Free daily submissions or premium carousel placement. Every submission is reviewed before publication.</p><div className="plan-switch"><button className={plan === "free" ? "chosen" : ""} onClick={() => setPlan("free")}>Free submit <b>₦0</b></button><button className={plan === "paid" ? "chosen" : ""} onClick={() => setPlan("paid")}>Carousel <b>₦5,999</b></button></div><form onSubmit={submitPost}><label>Your name<input required placeholder="Name or brand name"/></label><label>Email address<input required type="email" placeholder="you@example.com"/></label><label>What are you submitting?<select required defaultValue=""><option value="" disabled>Select a category</option><option>Lifestyle</option><option>Clubs & nightlife</option><option>Entertainers</option><option>Musicians</option><option>Events / Agenda</option><option>Business / Brand</option><option>Other</option></select></label><label>Post title<input required placeholder="Give your post a clear title"/></label><label>Tell us about it<textarea required rows="4" placeholder="Share the details, links and useful context..."/></label><button className="button button-green full-width" type="submit">{plan === "paid" ? "Continue to ₦5,999 placement" : "Send free submission"} ↗</button><small className="fine-print">Submitting does not guarantee publication. Duplicate submissions may be declined. Backend, account and payment processing are being connected.</small></form></>}
        {(modal === "signup" || modal === "login") && <><span className="eyebrow">JOIN THE CULTURE</span><h2>{modal === "signup" ? "Create your Nochalant account." : "Welcome back."}</h2><p className="modal-intro">Register to submit stories, follow your submissions and promote what you're building.</p><form onSubmit={e => {e.preventDefault();showToast("Account authentication will be enabled when the backend is connected.");setModal("");}}>{modal === "signup" && <label>Full name<input required placeholder="Your name"/></label>}<label>Email address<input type="email" required placeholder="you@example.com"/></label><label>Password<input type="password" required minLength="8" placeholder="At least 8 characters"/></label><button className="button button-green full-width" type="submit">{modal === "signup" ? "Create account" : "Log in"} ↗</button></form><button className="switch-modal" onClick={() => setModal(modal === "signup" ? "login" : "signup")}>{modal === "signup" ? "Already registered? Log in" : "New to Nochalant? Register"}</button></>}
      </div></div>}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
