import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import { authClient, getAuthToken, rememberAuthSession, clearRememberedAuthSession } from "./auth.js";
import OpinionsPanel from "./OpinionsPanel.jsx";

const categories = ["All Gist", "Afrobeats & Jamz", "Nollywood Drama", "BBNaija / Reality", "Fashion & Swag", "Street Buzz", "Lifestyle", "Agenda"];
const submissionCategories = ["Lifestyle", "Clubs & Nightlife", "Entertainment", "Music", "Nollywood", "Street Buzz", "Business", "Agenda"];
const demoFaces = [
  { username: "thecultureplug", display_name: "Culture Plug", initials: "CP", tone: "lime" },
  { username: "naijavibe", display_name: "Naija Vibe", initials: "NV", tone: "orange" },
  { username: "theplaylist", display_name: "The Playlist", initials: "TP", tone: "cream" },
  { username: "streettalk", display_name: "Street Talk", initials: "ST", tone: "pink" },
  { username: "lagosafterdark", display_name: "Lagos After Dark", initials: "LA", tone: "purple" },
  { username: "benincitygist", display_name: "Benin City Gist", initials: "BG", tone: "lime" },
  { username: "thefilmroom", display_name: "The Film Room", initials: "FR", tone: "orange" },
  { username: "freshsounds", display_name: "Fresh Sounds", initials: "FS", tone: "cream" },
  { username: "styleplug", display_name: "Style Plug", initials: "SP", tone: "pink" },
  { username: "theweekendlink", display_name: "Weekend Link", initials: "WL", tone: "purple" }
];
const demoStories = [
  { id: "lead", category: "Afrobeats & Jamz", label: "EDITORIAL PREVIEW", title: "The sound, the scene and the next wave of Afrobeats", excerpt: "A closer look at the artists, releases and creative energy shaping the conversation.", image: "https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=1400&q=85", time: "Preview story", views: 0, read: "3 min read", author: "Nochalant Editorial Desk", body: "This is a sample editorial layout used to demonstrate how a Nochalant feature story will appear. Replace this preview with a fact-checked story, original reporting, approved images and a named editorial byline before publication." },
  { id: "nollywood", category: "Nollywood Drama", label: "EDITORIAL PREVIEW", title: "The conversations shaping Nollywood right now", excerpt: "From new productions to the people behind the camera, here is the culture worth following.", image: "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=1000&q=85", time: "Preview", views: 0, read: "4 min read", author: "Nochalant Editorial Desk", body: "Sample article content. No real celebrity claim or breaking-news headline is being presented here." },
  { id: "street", category: "Street Buzz", label: "EDITORIAL PREVIEW", title: "The city is outside: style, sound and street culture", excerpt: "The places, people and moments giving the city its own rhythm.", image: "https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=1000&q=85", time: "Preview", views: 0, read: "2 min read", author: "Nochalant Editorial Desk", body: "Sample article content. No real event details are being advertised here." },
  { id: "fashion", category: "Fashion & Swag", label: "EDITORIAL PREVIEW", title: "The looks bringing a fresh perspective to Naija style", excerpt: "A style desk preview for fashion, personal expression and emerging creatives.", image: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1000&q=85", time: "Preview", views: 0, read: "3 min read", author: "Nochalant Editorial Desk", body: "Sample article content for the Nochalant fashion desk." },
  { id: "reality", category: "BBNaija / Reality", label: "EDITORIAL PREVIEW", title: "Reality TV, fan culture and the conversations after the show", excerpt: "A place for reality entertainment coverage, reactions and verified updates.", image: "https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?auto=format&fit=crop&w=1000&q=85", time: "Preview", views: "—", read: "3 min read", body: "Sample article content for the reality desk." },
  { id: "life", category: "Lifestyle", label: "EDITORIAL PREVIEW", title: "The everyday culture shaping how we live and link up", excerpt: "Lifestyle, food, places and experiences from across the culture.", image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1000&q=85", time: "Preview", views: "—", read: "2 min read", body: "Sample article content for the lifestyle desk." }
];

function App() {
  const [category, setCategory] = useState("All Gist");
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState("");
  const [story, setStory] = useState(demoStories[0]);
  const [vote, setVote] = useState("");
  const [poll, setPoll] = useState(null);
  const [pollLoading, setPollLoading] = useState(true);
  const [pollError, setPollError] = useState("");
  const [voteBusy, setVoteBusy] = useState(false);
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
  const [audioPlayerVisible, setAudioPlayerVisible] = useState(true);
  const [formCategory, setFormCategory] = useState("Afrobeats & Jamz");
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [authMessage, setAuthMessage] = useState("");
  const [viewCounts, setViewCounts] = useState({});
  const [communityFaces, setCommunityFaces] = useState(demoFaces);
  const [artists, setArtists] = useState([]);
  const [artistsLoading, setArtistsLoading] = useState(true);
  const artistRailRef = useRef(null);
  const [opinions, setOpinions] = useState([]);
  const [selectedOpinion, setSelectedOpinion] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [isControlRoom] = useState(() => window.location.pathname.replace(/\/+$/, "") === "/control-room");
  const [controlRoomStatus, setControlRoomStatus] = useState("checking");
  const [controlRoomError, setControlRoomError] = useState("");
  const [opinionsPanelOpen, setOpinionsPanelOpen] = useState(false);
  const [opinionsPanelMode, setOpinionsPanelMode] = useState("dashboard");
  const [reportOpinion, setReportOpinion] = useState(null);
  const [leadSlide, setLeadSlide] = useState(0);
  const [carouselPaused, setCarouselPaused] = useState(false);
  const leadSlides = [
    { story: demoStories[0], type: "image" },
    { story: demoStories[2], type: "image" },
    { story: demoStories[3], type: "image" },
    { story: demoStories[4], type: "image" }
  ];
  useEffect(() => {
    if (carouselPaused) return;
    const timer = window.setInterval(() => setLeadSlide(current => (current + 1) % leadSlides.length), 5500);
    return () => window.clearInterval(timer);
  }, [carouselPaused, leadSlides.length]);
  const changeLeadSlide = (index) => {
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
  const verifyControlRoomAccess = async () => {
    setControlRoomStatus("checking");
    setControlRoomError("");
    let token;
    try {
      token = await getAuthToken();
    } catch (error) {
      const detail = error?.message || "Unknown Neon Auth session error.";
      setControlRoomStatus("error");
      setControlRoomError(`Neon Auth session check failed: ${detail}`);
      return false;
    }
    if (!token) {
      setControlRoomStatus("login");
      setControlRoomError("No active Nochalant session was found. Please sign in again.");
      return false;
    }
    try {
      const response = await fetch("/api/admin/opinions", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store"
      });
      const data = await response.json().catch(() => ({}));
      if (response.status === 401) {
        setControlRoomStatus("login");
        setControlRoomError(data.error || "Your session was not accepted by Nochalant. Please sign in again.");
        return false;
      }
      if (response.status === 403) {
        setControlRoomStatus("denied");
        setControlRoomError(data.error || "This account is not authorized for the Nochalant Control Room.");
        return false;
      }
      if (response.status === 404) {
        throw new Error("Nochalant's admin API returned HTTP 404. The deployed API route is missing or not being resolved.");
      }
      if (!response.ok || !data.ok) {
        throw new Error(data.error || `Nochalant admin API returned HTTP ${response.status}.`);
      }
      setControlRoomStatus("authorized");
      return true;
    } catch (error) {
      setControlRoomStatus("error");
      setControlRoomError(error?.message || "Control Room access could not be verified.");
      return false;
    }
  };

  const submitControlRoomLogin = async event => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");
    setControlRoomStatus("checking");
    setControlRoomError("");
    try {
      if (!authClient) throw new Error("Authentication is not configured.");
      const result = await authClient.signIn.email({ email, password });
      if (result?.error) throw new Error(result.error.message || "Sign-in failed.");
      const signedInUser = rememberAuthSession(result);
      const session = await authClient.getSession();
      const sessionUser = rememberAuthSession(session);
      if (sessionUser || signedInUser) setCurrentUser(sessionUser || signedInUser);
      await verifyControlRoomAccess();
    } catch (error) {
      setControlRoomStatus("login");
      setControlRoomError(error?.message || "Unable to sign in.");
    }
  };

  useEffect(() => {
    if (!authClient) {
      if (isControlRoom) { setControlRoomStatus("error"); setControlRoomError("Authentication is not configured."); }
      return;
    }
    let active = true;
    authClient.getSession().then(async result => {
      if (!active) return;
      if (result?.data?.user) {
        setCurrentUser(result.data.user);
        if (isControlRoom) await verifyControlRoomAccess();
      } else if (isControlRoom) {
        setControlRoomStatus("login");
      }
    }).catch(error => {
      if (active && isControlRoom) { setControlRoomStatus("login"); setControlRoomError(error?.message || "Please sign in to continue."); }
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        const token = await getAuthToken();
        const response = await fetch("/api/hot-or-trash?slug=homepage-fashion-feature", {
          signal: controller.signal,
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data.ok) throw new Error(data.error || "Voting is temporarily unavailable.");
        if (!controller.signal.aborted) {
          setPoll(data.poll);
          setVote(data.poll.user_vote || "");
          setPollError("");
        }
      } catch (error) {
        if (error?.name !== "AbortError" && !controller.signal.aborted) setPollError(error?.message || "Voting is temporarily unavailable.");
      } finally {
        if (!controller.signal.aborted) setPollLoading(false);
      }
    })();
    return () => controller.abort();
  }, [currentUser?.id]);

  const castVote = async (choice) => {
    if (!currentUser) {
      setAuthMessage("Log in to cast your vote. One vote per account for this poll.");
      setModal("login");
      return;
    }
    if (voteBusy || vote || !poll) return;
    setVoteBusy(true);
    setPollError("");
    try {
      const token = await getAuthToken();
      if (!token) throw new Error("Your session has expired. Please log in again.");
      const response = await fetch("/api/hot-or-trash", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ slug: poll.slug, choice })
      });
      const data = await response.json().catch(() => ({}));
      if (response.status === 409) throw new Error(data.error || "You have already voted in this poll.");
      if (!response.ok || !data.ok) throw new Error(data.error || "Your vote could not be saved.");
      setVote(choice);
      setPoll(current => current ? { ...current, ...data.results } : current);
      notify("Your vote has been counted.");
    } catch (error) {
      setPollError(error?.message || "Your vote could not be saved. Please try again.");
    } finally {
      setVoteBusy(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/opinions", { signal: controller.signal })
      .then(response => response.ok ? response.json() : null)
      .then(data => {
        if (data?.ok && Array.isArray(data.opinions)) setOpinions(data.opinions);
      })
      .catch(error => {
        if (error?.name !== "AbortError") console.error("Nochalant opinions could not load:", error);
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/artists", { signal: controller.signal })
      .then(response => response.ok ? response.json() : null)
      .then(data => { if (data?.ok && Array.isArray(data.artists)) setArtists(data.artists); })
      .catch(error => { if (error?.name !== "AbortError") console.error("Nochalant artists could not load:", error); })
      .finally(() => { if (!controller.signal.aborted) setArtistsLoading(false); });
    return () => controller.abort();
  }, []);

  const moveArtistRail = (direction) => {
    const rail = artistRailRef.current;
    if (!rail) return;
    rail.scrollBy({ left: direction * Math.max(rail.clientWidth * 0.72, 220), behavior: "smooth" });
  };

  useEffect(() => {
    fetch("/api/community/faces")
      .then(response => response.ok ? response.json() : null)
      .then(data => {
        if (data?.ok && Array.isArray(data.profiles) && data.profiles.length) {
          setCommunityFaces(data.profiles.map((profile, index) => ({
            ...profile,
            tone: ["lime", "orange", "cream", "pink", "purple"][index % 5]
          })));
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    demoStories.forEach(item => {
      fetch(`/api/posts/${encodeURIComponent(item.id)}/views`)
        .then(response => response.ok ? response.json() : null)
        .then(data => { if (data?.ok) setViewCounts(current => ({ ...current, [item.id]: data.views })); })
        .catch(() => {});
    });
  }, []);

  const openStory = (item) => {
    setStory(item);
    setCommentDraft("");
    setModal("story");
    fetch(`/api/posts/${encodeURIComponent(item.id)}/views`, { method: "POST" })
      .then(response => response.ok ? response.json() : null)
      .then(data => { if (data?.ok) setViewCounts(current => ({ ...current, [item.id]: data.views })); })
      .catch(() => {});
  };
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

  const signOutUser = async () => {
    try {
      await authClient?.signOut?.();
      clearRememberedAuthSession();
      setCurrentUser(null);
      setOpinionsPanelOpen(false);
      notify("You have been signed out.");
    } catch (error) {
      notify(error?.message || "Unable to sign out. Please try again.");
    }
  };

  const submitAuth = async (event) => {
    event.preventDefault();
    if (!authClient) {
      setAuthMessage("Authentication is not configured yet. Please try again later.");
      return;
    }
    const form = event.currentTarget;
    const formData = new FormData(form);
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");
    const name = String(formData.get("name") || "").trim();
    setAuthBusy(true);
    setAuthMessage("");
    try {
      const result = modal === "signup"
        ? await authClient.signUp.email({ name, email, password })
        : await authClient.signIn.email({ email, password });
      if (result?.error) throw new Error(result.error.message || "Authentication failed.");
      const sessionResult = await authClient.getSession();
      if (sessionResult?.data?.user) setCurrentUser(sessionResult.data.user);
      setAuthMessage(modal === "signup" ? "Account created. Check your email if verification is required." : "You are signed in.");
      notify(modal === "signup" ? "Your Nochalant account was created." : "Welcome back to Nochalant.");
      closeModal();
    } catch (error) {
      setAuthMessage(error?.message || "We couldn't complete that request. Please try again.");
    } finally {
      setAuthBusy(false);
    }
  };

  const submitGist = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!currentUser) {
      setModal("login");
      setAuthMessage("Log in to submit your gist. Your draft has not been sent.");
      return;
    }
    if (!authClient) {
      notify("Account services are not configured. Please try again later.");
      return;
    }
    const formData = new FormData(form);
    const payload = {
      title: String(formData.get("title") || "").trim(),
      body: String(formData.get("body") || "").trim(),
      category: String(formData.get("category") || ""),
      sourceUrl: String(formData.get("sourceUrl") || "").trim()
    };
    try {
      const token = await getAuthToken();
      if (!token) throw new Error("Your session has expired. Please log in again.");
      const response = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok) throw new Error(data.error || "We couldn't submit your gist.");
      form.reset();
      setFormCategory("Afrobeats & Jamz");
      closeModal();
      notify("Your gist has been submitted for editorial review.");
    } catch (error) {
      notify(error?.message || "Submission failed. Please try again.");
    }
  };
  const toggleLike = (id) => setLikes(current => ({ ...current, [id]: !current[id] }));
  const addComment = (event) => {
    event.preventDefault();
    if (!commentDraft.trim()) return;
    setComments(current => ({ ...current, [story.id]: [...(current[story.id] || []), commentDraft.trim()] }));
    setCommentDraft("");
    notify("Comment added to this local preview.");
  };

  if (isControlRoom) return <div className="control-room-shell">
    <header className="control-room-header">
      <a className="brand" href="/">NOCHALANT<span>.</span><small>PRIVATE ADMINISTRATION</small></a>
      <a className="control-room-home" href="/">Back to public site</a>
    </header>
    <main className="control-room-content">
      {controlRoomStatus === "checking" && <section className="control-room-gate"><span className="eyebrow">SECURE ACCESS CHECK</span><h1>Opening Control Room…</h1><p>Verifying your session and administrator permissions.</p></section>}
      {controlRoomStatus === "login" && <section className="control-room-gate"><span className="eyebrow">PRIVATE ADMINISTRATION</span><h1>Nochalant Control Room.</h1><p>Sign in with the authorized owner account. This entrance is not available to public members.</p><form className="control-room-login" onSubmit={submitControlRoomLogin}><label>Email address<input name="email" type="email" autoComplete="username" required placeholder="Owner email"/></label><label>Password<input name="password" type="password" autoComplete="current-password" required placeholder="Your password"/></label><button className="button button-green full-width" type="submit">Sign in securely</button></form>{controlRoomError && <p className="control-room-error" role="alert">{controlRoomError}</p>}</section>}
      {controlRoomStatus === "denied" && <section className="control-room-gate"><span className="eyebrow">ACCESS RESTRICTED</span><h1>Administrator access required.</h1><p>{controlRoomError || "This account does not have permission to enter the Control Room."}</p><a className="button button-outline" href="/">Return to Nochalant</a></section>}
      {controlRoomStatus === "error" && <section className="control-room-gate"><span className="eyebrow">SECURE ACCESS UNAVAILABLE</span><h1>We couldn't verify access.</h1><p>{controlRoomError}</p><button className="button button-green" onClick={verifyControlRoomAccess}>Try again</button></section>}
      {controlRoomStatus === "authorized" && <><div className="control-room-welcome"><span className="eyebrow">PRIVATE · AUTHORIZED SESSION</span><h1>Control Room</h1><p>Signed in as {currentUser?.name || currentUser?.email || "authorized administrator"}.</p></div><OpinionsPanel open={true} mode="admin" onClose={() => { window.location.href = "/"; }} onNotice={notify} /></>}
    </main>
    {toast && <div className="toast" role="status">{toast}</div>}
  </div>;

  return <div className="site-shell">
    <div className="ticker"><span className="ticker-label">NOCHALANT LIVE</span><div className="ticker-window"><div className="ticker-track"><span>NO DEY FORM, JUST PURE GIST</span><span>YOUR CULTURE. YOUR PEOPLE. YOUR BUZZ.</span><span>FREE DAILY SUBMISSIONS</span><span>WHAT'S HAPPENING? CHECK THE AGENDA</span><span>NO DEY FORM, JUST PURE GIST</span><span>YOUR CULTURE. YOUR PEOPLE. YOUR BUZZ.</span></div></div></div>
    <header className="site-header"><div className="nav-wrap">
      <a className="brand" href="#top">NOCHALANT<span>.</span><small>NO DEY FORM, JUST PURE GIST 🇳🇬</small></a>
      <button className="menu-toggle" onClick={() => setMobileMenu(!mobileMenu)} aria-label="Toggle navigation">☰</button>
      <nav className={mobileMenu ? "main-nav open" : "main-nav"}><a href="#latest" onClick={() => setMobileMenu(false)}>Latest gist</a><a href="#categories" onClick={() => setMobileMenu(false)}>Categories</a><a href="#hot-or-trash" onClick={() => setMobileMenu(false)}>Hot or Trash</a><a href="#agenda" onClick={() => setMobileMenu(false)}>Agenda</a><button onClick={() => {setMobileMenu(false);if (!currentUser) setModal("login");else {setOpinionsPanelMode("dashboard");setOpinionsPanelOpen(true);}}}>My Opinions</button>{currentUser ? <span className="nav-auth-menu"><span className="nav-signed-in">Signed in · {currentUser.name || currentUser.email}</span><button onClick={() => {setMobileMenu(false);signOutUser();}}>Log out</button></span> : <span className="nav-auth-menu"><button onClick={() => {setModal("login");setMobileMenu(false);}}>Log in</button><button onClick={() => {setModal("signup");setMobileMenu(false);}}>Sign up</button></span>}</nav>
      <div className="nav-actions">{currentUser ? <button className="text-button nav-login" onClick={signOutUser}>Log out</button> : <button className="text-button nav-login" onClick={() => setModal("login")}>Log in</button>}<button className="nav-spill" onClick={() => setModal("submit")}><span>Spill the tea</span></button>{!currentUser && <button className="nav-join" onClick={() => setModal("signup")}><span>Join Nochalant</span></button>}</div>
    </div></header>

    <main id="top">
      <section className="container lead-layout">
        <div className="lead-copy"><div className="eyebrow"><span className="live-dot"></span> THE CULTURE DESK · EDITORIAL PREVIEW</div>
          <h1>Worry no more.<br/><em>Nochalant is here.</em></h1>
          <p>Your plug for Nigerian entertainment, music, nightlife, lifestyle and everything happening around you. No long talk — just the gist that matters.</p>
          <div className="hero-actions"><button className="button button-green" onClick={() => setModal("submit")}>Spill the gist</button><a className="button button-outline" href="#latest">Catch up on gist</a></div>
          
        </div>
        <article className="lead-story" aria-label="Featured Nochalant carousel" onMouseEnter={() => setCarouselPaused(true)} onMouseLeave={() => setCarouselPaused(false)}>
          {leadSlides.map((slide, index) => <div className={index === leadSlide ? "lead-slide active" : "lead-slide"} key={slide.story.id} aria-hidden={index !== leadSlide}>
            <img className="lead-media" src={slide.story.image} alt={slide.story.title}/>
            <div className="lead-overlay"></div>
            <div className="lead-story-top"><span className="pill pill-hot">HOT DROP</span><span className="demo-label">EDITORIAL PREVIEW</span></div>
            <div className="lead-story-bottom"><div className="story-meta"><span>{slide.story.category}</span><span>· {slide.story.read}</span></div><h2>{slide.story.title}</h2><p>{slide.story.excerpt}</p><div className="lead-actions"><button onClick={e => {e.stopPropagation(); openStory(slide.story);}}>Read story</button><b>{index + 1} / {leadSlides.length}</b></div></div>
          </div>)}
          <div className="lead-carousel-controls">
            <button className="lead-carousel-arrow" aria-label="Previous featured slide" onClick={e => {e.stopPropagation();changeLeadSlide(leadSlide-1);}}>PREV</button>
            <div className="lead-carousel-dots">{leadSlides.map((slide,index)=><button key={slide.story.id} className={index===leadSlide?"active":""} aria-label={`Go to featured slide ${index+1}`} aria-current={index===leadSlide?"true":undefined} onClick={e=>{e.stopPropagation();changeLeadSlide(index);}}/>)}</div>
            <button className="lead-carousel-arrow" aria-label="Next featured slide" onClick={e => {e.stopPropagation();changeLeadSlide(leadSlide+1);}}>NEXT</button>
          </div>
        </article>
      </section>

      <section className="artists-section container" id="artists" aria-labelledby="artists-title">
        <div className="artists-heading">
          <div><span className="eyebrow">THE SOUND OF THE CULTURE</span><h2 id="artists-title">Artists on <em>Nochalant.</em></h2><p>Meet the voices, sounds and talent moving the culture.</p></div>
          <div className="artists-controls" aria-label="Artist carousel controls">
            <button type="button" onClick={() => moveArtistRail(-1)} aria-label="Previous artists" disabled={artists.length === 0}><span aria-hidden="true">←</span></button>
            <button type="button" onClick={() => moveArtistRail(1)} aria-label="Next artists" disabled={artists.length === 0}><span aria-hidden="true">→</span></button>
          </div>
        </div>
        <div className="artists-viewport" ref={artistRailRef} aria-label="Artists on Nochalant. Swipe or use the arrow controls to browse artists." tabIndex="0">
          {artists.length > 0 ? <div className="artists-track">{artists.map(artist => <a className="artist-card" key={artist.id} href={artist.profile_url || "#artists"} target={artist.profile_url ? "_blank" : undefined} rel={artist.profile_url ? "noreferrer" : undefined}>
            <span className="artist-avatar">{artist.image_url ? <img src={artist.image_url} alt={artist.name} loading="lazy" /> : <span>{artist.name?.trim().slice(0,1).toUpperCase() || "A"}</span>}</span>
            <span className="artist-name">{artist.name}</span>
            {artist.genre && <span className="artist-genre">{artist.genre}</span>}
          </a>)}</div> : <div className="artists-empty">{artistsLoading ? "Loading artists…" : "The artist spotlight is getting ready. Check back soon."}</div>}
        </div>
      </section>

      <section className="section container" id="latest"><div className="section-heading"><div><div className="eyebrow">FRESH FROM THE CULTURE</div><h2>Latest <em>crispy gist.</em></h2></div><span className="demo-label">SAMPLE CONTENT · NOT LIVE NEWS</span></div>
        <div className="filter-row" id="categories"><div className="category-tabs">{categories.map(item => <button key={item} className={category === item ? "category-tab active" : "category-tab"} onClick={() => setCategory(item)}>{item}</button>)}</div><label className="search-box"><span aria-hidden="true">⌕</span><input aria-label="Search stories" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search the gist"/></label></div>
        <div className="story-grid">{filtered.map(item => <article className="story-card" key={item.id} role="button" tabIndex="0" aria-label={`Open story: ${item.title}`} onClick={() => openStory(item)} onKeyDown={e => e.key === "Enter" && e.target === e.currentTarget && openStory(item)}><div className="story-image"><img src={item.image} alt=""/><span className="story-category">{item.category}</span></div><div className="story-content"><div className="story-meta"><span>{item.time}</span><span>{item.read}</span></div><h3>{item.title}</h3><p>{item.excerpt}</p><div className="story-byline"><span>By {item.author}</span><span>{typeof viewCounts[item.id] === "number" ? `${viewCounts[item.id].toLocaleString()} views` : "Views loading"}</span></div><div className="story-foot"><button className={likes[item.id] ? "like-action liked" : "like-action"} onClick={e => {e.stopPropagation();toggleLike(item.id);}} aria-pressed={!!likes[item.id]}>♡ {likes[item.id] ? "Liked" : "Like"}</button><span>◌ {comments[item.id]?.length || 0} comments</span><b>Full gist </b></div></div></article>)}{filtered.length === 0 && <div className="empty-state">No stories in this category yet. Check back soon.</div>}</div>
      </section>

      <section className="section container split-section" id="hot-or-trash"><div className="jury-image"><img src="https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=1000&q=85" alt="Street fashion editorial"/><span className="image-tag">THE STREET JURY</span></div><div className="jury-panel"><div className="eyebrow">NO BE EVERY TREND WE GO FOLLOW</div><h2>Hot or <em>trash?</em></h2><p>Everybody get opinion. Is this look, sound or trend giving what it should give? Cast your vote.</p>{opinions.length > 0 && <div className="opinion-rail" aria-label="Opinions from Nochalant users"><div className="opinion-rail-top"><span>THE PEOPLE HAVE SPOKEN</span><span>{opinions.length} COMMUNITY {opinions.length === 1 ? "TAKE" : "TAKES"}</span></div><div className="opinion-rail-window"><div className="opinion-rail-track">{[...opinions, ...opinions].map((item, index) => <button className="opinion-chip" key={item.id + "-" + index} onClick={() => setSelectedOpinion(item)}><span className="opinion-topic">{item.topic}</span><span className="opinion-quote">“{item.body}”</span><span className="opinion-author">— {item.author_name}</span></button>)}</div></div></div>}<div className="jury-options"><button className={vote === "hot" ? "jury-option hot selected" : "jury-option hot"} onClick={() => castVote("hot")} disabled={voteBusy || !!vote || pollLoading || !poll}>🔥 Pure fire</button><button className={vote === "trash" ? "jury-option trash selected" : "jury-option trash"} onClick={() => castVote("trash")} disabled={voteBusy || !!vote || pollLoading || !poll}>✕ Off key</button></div><div className="vote-results"><div className="vote-labels"><span>{poll ? `COMMUNITY VOTES · ${poll.total_votes}` : "COMMUNITY VOTES"}</span><span>{vote ? (vote === "hot" ? "YOU VOTED PURE FIRE" : "YOU VOTED OFF KEY") : pollLoading ? "LOADING" : "LIVE RESULTS"}</span></div><div className="vote-result-row"><span>🔥 Pure fire</span><b>{poll?.hot_percent ?? 0}%</b></div><div className="vote-bar"><i style={{width: `${poll?.hot_percent ?? 0}%`}}/></div><div className="vote-result-row"><span>✕ Off key</span><b>{poll?.trash_percent ?? 0}%</b></div><div className="vote-bar vote-bar-trash"><i style={{width: `${poll?.trash_percent ?? 0}%`}}/></div></div><small className="muted">{pollError || (pollLoading ? "Loading community results…" : vote ? "Your vote has been recorded. Thanks for having your say." : currentUser ? "One vote per account. Your choice is saved securely." : "Log in to vote. Community results update as votes are counted.")}</small></div></section>

      <section className="agenda-section" id="agenda"><div className="container"><div className="section-heading"><div><div className="eyebrow">THE CITY NEVER SLEEPS</div><h2>What's on the <em>Agenda?</em></h2></div><span className="agenda-note">EVENTS · HANGOUTS · EXPERIENCES</span></div>
        <div className="nochalant-faces">
          <div className="faces-heading"><div className="faces-title"><span className="faces-brand-mark" aria-hidden="true"><span></span></span><h3>Nochalant Faces</h3></div></div>
          <div className="faces-viewport" aria-label="Nochalant community profiles">
            <div className="faces-track">{[...communityFaces, ...communityFaces].map((face, index) => <button className="face-item" key={face.username + "-" + index} type="button" aria-label={face.display_name + " demo profile"} title={face.display_name}><span className={"face-avatar tone-" + (face.tone || "lime")}><span>{face.initials || face.display_name.slice(0,2).toUpperCase()}</span></span><span className="face-name">{face.display_name}</span></button>)}</div>
          </div>
          
        </div>
        <div className="agenda-empty"><h3>Your next link-up belongs here.</h3><p>Upcoming events will appear after they are submitted and approved by the Nochalant team.</p><button className="button button-outline" onClick={() => {setFormCategory("Agenda");setModal("submit");}}>Submit an event</button></div></div></section>

      <section className="promo-section container"><div className="promo-copy"><div className="eyebrow">GOT SOMETHING TO SAY?</div><h2>Don't just watch<br/>the buzz. <em>Be the buzz.</em></h2><p>Got a new song, event, club night, brand, talent or lifestyle story? Send it to Nochalant. Free daily submissions are welcome.</p><button className="button button-green" onClick={() => setModal("submit")}>Spill your gist</button></div><div className="pricing-card"><div className="pricing-top"><span className="pill pill-gold">OPTIONAL FEATURE</span></div><h3>Get on the <em>carousel.</em></h3><p>Give your promotion a premium spot in the Nochalant spotlight.</p><div className="price">₦5,999 <small>/ placement</small></div><ul><li>Premium carousel consideration</li><li>Editorial review required</li><li>Payment confirmation required</li></ul><button className="button button-dark" onClick={() => {setFormCategory("Afrobeats & Jamz");setModal("submit");}}>Request a placement </button><small className="fine-print">Payment processing is not connected yet. No payment will be collected in this preview.</small></div></section>
    </main>

    <section className="newsletter-section container" aria-labelledby="newsletter-title">
      <div className="newsletter-copy"><span className="eyebrow">THE NOCHALANT DROP</span><h2 id="newsletter-title">The gist, straight to <em>you.</em></h2><p>Fresh stories, new music and what's happening next. No noise.</p></div>
      <form className="newsletter-form" onSubmit={e => {e.preventDefault();setModal("newsletter-success");}}>
        <label className="sr-only" htmlFor="newsletter-email">Your email address</label>
        <input id="newsletter-email" type="email" required value={newsletterEmail} onChange={e => setNewsletterEmail(e.target.value)} placeholder="Your email address"/>
        <button type="submit">Gimme Update</button>
      </form>
    </section>
    <footer className="footer"><div className="container footer-main"><div><a className="brand footer-brand" href="#top">NOCHALANT<span>.</span></a><p>No Dey Form, Just Pure Gist 🇳🇬<br/>Worry no more, Nochalant is here.</p></div><div className="footer-links"><a href="#latest">Latest gist</a><a href="#categories">Categories</a><a href="#agenda">Agenda</a><button onClick={() => setModal("submit")}>Submit gist</button><a href="mailto:hello@nochalant.com">Contact</a></div></div><div className="container footer-bottom"><span>© 2026 Nochalant. All rights reserved.</span><span>Made for the culture. 🇳🇬</span><span className="footer-credit">Powered by Squadglobal.</span></div></footer>

    <audio ref={audioRef} preload="metadata" src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" />
    {audioPlayerVisible ? <section className="mini-player" aria-label="Nochalant audio player">
      <img className="player-artwork" src={demoStories[0].image} alt="Nochalant demo track artwork"/>
      <div className="player-main">
        <div className="player-title"><b>Nochalant Player</b><small>{audioError ? "Audio unavailable — tap play to retry" : "Demo audio · Sample artwork"}</small></div>
        <div className="player-progress">
          <span>{formatAudioTime(audioCurrent)}</span>
          <input aria-label="Seek audio" type="range" min="0" max={audioDuration || 0} step="0.1" value={Math.min(audioCurrent, audioDuration || 0)} onChange={seekAudio} disabled={!audioDuration} />
          <span>{formatAudioTime(audioDuration)}</span>
        </div>
      </div>
      <button className="player-toggle" onClick={toggleAudio} aria-label={audioPlaying ? "Pause audio" : "Play audio"}><span className={audioPlaying ? "player-pause-symbol" : "player-play-symbol"} aria-hidden="true"/></button>
      <button className="player-close" onClick={() => setAudioPlayerVisible(false)} aria-label="Close player" title="Close player">×</button>
    </section> : <button className="player-reopen" onClick={() => setAudioPlayerVisible(true)} aria-label="Open audio player">♫ <span>Player</span></button>}

    {modal && <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && closeModal()}><div className="modal-card" role="dialog" aria-modal="true" aria-labelledby="modal-title"><button ref={modalCloseRef} className="modal-close" onClick={closeModal} aria-label="Close dialog">×</button>
      {modal === "newsletter-success" && <div className="newsletter-success"><span className="brand-signature" aria-hidden="true">N</span><span className="eyebrow">YOU'RE IN THE LOOP</span><h2 id="modal-title">Good things are coming.</h2><p>Thanks for wanting the Nochalant update. Email signups aren't connected yet, so your address hasn't been saved.</p><button className="button button-green full-width" onClick={closeModal}>Got you</button></div>}
      {modal === "story" && <><span className="eyebrow">{story.category} · {story.label}</span><h2 id="modal-title">{story.title}</h2><div className="article-byline"><span>By {story.author}</span><span>{typeof viewCounts[story.id] === "number" ? `${viewCounts[story.id].toLocaleString()} views` : "Reader count loading"}</span><span>{story.read}</span></div><img className="modal-story-image" src={story.image} alt=""/><p>{story.body}</p><div className="comment-area"><h3>Join the conversation</h3>{(comments[story.id] || []).map((comment, index) => <p className="comment" key={index}>{comment}</p>)}<form onSubmit={addComment}><label className="sr-only" htmlFor="comment-input">Your comment</label><textarea id="comment-input" rows="3" value={commentDraft} onChange={e => setCommentDraft(e.target.value)} placeholder="Drop your comment..."/><button className="button button-green" type="submit">Post comment</button></form><small className="fine-print">Comments are stored only in this browser preview.</small></div></>}
      {modal === "submit" && <><span className="eyebrow">YOUR STORY. YOUR PLATFORM.</span><h2 id="modal-title">Spill the <em>gist.</em></h2><p className="modal-intro">Send your story for editorial review. Sign in first. One free submission is available per account each day.</p><form onSubmit={submitGist}><label>Your name<input required placeholder="Name or brand name"/></label><label>Email address<input required type="email" placeholder="you@example.com"/></label><label>Category<select name="category" value={submissionCategories.includes(formCategory) ? formCategory : "Entertainment"} onChange={e => setFormCategory(e.target.value)}>{submissionCategories.map(x => <option key={x} value={x}>{x}</option>)}</select></label><label>Post title<input name="title" required minLength="8" maxLength="180" placeholder="Give your gist a clear title"/></label><label>Tell us the full gist<textarea name="body" required minLength="20" maxLength="12000" rows="5" placeholder="Add details, links and useful context..."/></label><label>Source link (optional)<input name="sourceUrl" type="url" placeholder="https://..."/></label><label className="check-label"><input type="checkbox" required/> I confirm this submission is accurate and I have permission to share its content.</label><button className="button button-green full-width" type="submit">Submit for editorial review</button><small className="fine-print">Your submission is saved privately as pending until an editor reviews it. Duplicate submissions and the one-per-day free limit are checked by the server.</small></form></>}
      {(modal === "signup" || modal === "login") && <><span className="eyebrow">JOIN THE CULTURE</span><h2 id="modal-title">{modal === "signup" ? "Create your account." : "Welcome back."}</h2><p className="modal-intro">Sign in or create your Nochalant account securely.</p><form onSubmit={submitAuth}>{modal === "signup" && <label>Full name<input name="name" required placeholder="Your name"/></label>}<label>Email address<input name="email" type="email" required placeholder="you@example.com"/></label><label>Password<input name="password" type="password" required minLength="8" placeholder="At least 8 characters"/></label><button className="button button-green full-width" type="submit" disabled={authBusy}>{authBusy ? "Please wait…" : modal === "signup" ? "Create account" : "Log in"}</button>{authMessage && <small className="fine-print" role="status">{authMessage}</small>}</form><button className="switch-modal" onClick={() => setModal(modal === "signup" ? "login" : "signup")}>{modal === "signup" ? "Already registered? Log in" : "New here? Register"}</button></>}
    </div></div>}
    {selectedOpinion && <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && setSelectedOpinion(null)}><div className="modal-card opinion-detail" role="dialog" aria-modal="true" aria-labelledby="opinion-detail-title"><button className="modal-close" onClick={() => setSelectedOpinion(null)} aria-label="Close opinion">×</button><span className="eyebrow">{selectedOpinion.topic} · NOCHALANT OPINION</span><h2 id="opinion-detail-title">The people have a say.</h2><blockquote>“{selectedOpinion.body}”</blockquote><p className="opinion-author-detail">Shared by {selectedOpinion.author_name}</p><div className="opinion-detail-actions"><button className="button button-outline full-width" onClick={() => {if (!currentUser) {setSelectedOpinion(null);setModal("login");setAuthMessage("Log in to report content.");} else {setReportOpinion(selectedOpinion);setSelectedOpinion(null);setOpinionsPanelMode("report");setOpinionsPanelOpen(true);}}}>Report this opinion</button><button className="button button-green full-width" onClick={() => {setSelectedOpinion(null);if (!currentUser) setModal("login");else {setOpinionsPanelMode("dashboard");setOpinionsPanelOpen(true);}}}>Share your take</button></div></div></div>}
    <OpinionsPanel open={opinionsPanelOpen} mode={opinionsPanelMode} opinion={reportOpinion} onClose={() => setOpinionsPanelOpen(false)} onNotice={notify} />
    {toast && <div className="toast" role="status">{toast}</div>}
  </div>;
}
createRoot(document.getElementById("root")).render(<App />);
