import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import { authClient, getAuthToken, rememberAuthSession, clearRememberedAuthSession } from "./auth.js";
import OpinionsPanel from "./OpinionsPanel.jsx";
import SocialFeed from "./SocialFeed.jsx";

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
  const [activeScreen, setActiveScreen] = useState("home");
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
  const [artistRailPaused, setArtistRailPaused] = useState(false);
  const [opinions, setOpinions] = useState([]);
  const [selectedOpinion, setSelectedOpinion] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [accountProfile, setAccountProfile] = useState(null);
  const [accountProfileLoading, setAccountProfileLoading] = useState(false);
  const [artistStudio, setArtistStudio] = useState(null);
  const [artistStudioError, setArtistStudioError] = useState("");
  const [artistStudioBusy, setArtistStudioBusy] = useState(false);
  const [isControlRoom] = useState(() => window.location.pathname.replace(/\/+$/, "") === "/control-room");
  const [controlRoomStatus, setControlRoomStatus] = useState("checking");
  const [controlRoomError, setControlRoomError] = useState("");
  const [opinionsPanelOpen, setOpinionsPanelOpen] = useState(false);
  const [opinionsPanelMode, setOpinionsPanelMode] = useState("dashboard");
  const [reportOpinion, setReportOpinion] = useState(null);
  const [podcastSelection, setPodcastSelection] = useState(0);
  const [podcastCatalogue, setPodcastCatalogue] = useState({ shows: [], seasons: [], episodes: [], clips: [] });
  const [podcastCatalogueLoading, setPodcastCatalogueLoading] = useState(false);
  const [leadSlide, setLeadSlide] = useState(0);
  const [carouselPaused, setCarouselPaused] = useState(false);
  const podcastLibraryItems = [
    { title: "Sessions", subtitle: "Music & live performances", label: "NOCHALANT SESSIONS", description: "Live performances and stripped-back sets from the artists shaping the sound.", art: "podcast-library-art" },
    { title: "Street Stories", subtitle: "People & perspectives", label: "STREET STORIES", description: "Voices, places and perspectives from the streets and communities.", art: "podcast-library-art art-two" },
    { title: "Culture Talk", subtitle: "Interviews & conversations", label: "CULTURE TALK", description: "Unfiltered conversations about music, entertainment and Nigerian culture.", art: "podcast-library-art art-three" }
  ];
  const podcastDisplayItems = podcastCatalogue.shows.length ? podcastCatalogue.shows.map((show,index) => ({ id: show.id, title: show.title, subtitle: show.host_name || "Nochalant original series", label: show.title.toUpperCase(), description: show.description || "Original Nochalant conversations and culture.", art: index % 3 === 1 ? "podcast-library-art art-two" : index % 3 === 2 ? "podcast-library-art art-three" : "podcast-library-art", slug: show.slug })) : podcastLibraryItems;
  const selectedPodcastIndex = podcastSelection % Math.max(1,podcastDisplayItems.length);
  useEffect(() => {
    const controller = new AbortController();
    setPodcastCatalogueLoading(true);
    fetch("/api/podcast", { signal: controller.signal, cache: "no-store" })
      .then(response => response.json().then(data => ({ response, data })))
      .then(({response,data}) => { if (!response.ok || !data.ok) throw new Error(data.error || "Podcast catalogue unavailable."); if (!controller.signal.aborted) setPodcastCatalogue(data); })
      .catch(error => { if (error?.name !== "AbortError") console.warn("Podcast catalogue unavailable:",error?.message || error); })
      .finally(() => { if (!controller.signal.aborted) setPodcastCatalogueLoading(false); });
    return () => controller.abort();
  }, []);

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
    if (!currentUser || accountProfile?.profile?.account_type !== "artist") { setArtistStudio(null); return; }
    const controller = new AbortController();
    (async () => {
      try {
        const token = await getAuthToken();
        if (!token) return;
        const response = await fetch("/api/artist/studio", { signal: controller.signal, headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data.ok) throw new Error(data.error || "Artist studio could not load.");
        if (!controller.signal.aborted) { setArtistStudio(data); setArtistStudioError(""); }
      } catch (error) {
        if (error?.name !== "AbortError" && !controller.signal.aborted) setArtistStudioError(error?.message || "Artist studio could not load.");
      }
    })();
    return () => controller.abort();
  }, [currentUser?.id, accountProfile?.profile?.account_type]);

  const submitArtistStudio = async (event, action) => {
    event.preventDefault();
    setArtistStudioBusy(true);
    setArtistStudioError("");
    try {
      const formData = new FormData(event.currentTarget);
      const payload = { action };
      for (const [key, value] of formData.entries()) payload[key] = String(value).trim();
      const token = await getAuthToken();
      if (!token) throw new Error("Your session has expired. Please log in again.");
      const response = await fetch("/api/artist/studio", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok) throw new Error(data.error || "Your changes could not be saved.");
      const refreshed = await fetch("/api/artist/studio", { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
      const latest = await refreshed.json().catch(() => ({}));
      if (refreshed.ok && latest.ok) setArtistStudio(latest);
      notify(action === "create_release" ? "Release draft created." : "Artist profile updated.");
      if (action !== "update_profile") event.currentTarget.reset();
    } catch (error) { setArtistStudioError(error?.message || "Artist studio action failed."); }
    finally { setArtistStudioBusy(false); }
  };

  useEffect(() => {
    if (!currentUser) { setAccountProfile(null); return; }
    const controller = new AbortController();
    setAccountProfileLoading(true);
    (async () => {
      try {
        const token = await getAuthToken();
        if (!token) return;
        const response = await fetch("/api/account/type", { signal: controller.signal, headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
        const data = await response.json().catch(() => ({}));
        if (response.ok && data.ok && !controller.signal.aborted) setAccountProfile(data);
      } catch (error) {
        if (error?.name !== "AbortError") console.warn("Account dashboard profile could not load:", error?.message || error);
      } finally {
        if (!controller.signal.aborted) setAccountProfileLoading(false);
      }
    })();
    return () => controller.abort();
  }, [currentUser?.id]);

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        // Poll totals are public; do not attach a possibly stale login token.
        const response = await fetch("/api/hot-or-trash?slug=homepage-fashion-feature", {
          signal: controller.signal,
          cache: "no-store"
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
    const firstCard = rail.querySelector(".artist-card");
    const distance = firstCard ? firstCard.getBoundingClientRect().width + 20 : Math.max(rail.clientWidth * 0.72, 220);
    const maxScroll = rail.scrollWidth - rail.clientWidth;
    if (direction > 0 && rail.scrollLeft >= maxScroll - 8) rail.scrollTo({ left: 0, behavior: "smooth" });
    else if (direction < 0 && rail.scrollLeft <= 8) rail.scrollTo({ left: maxScroll, behavior: "smooth" });
    else rail.scrollBy({ left: direction * distance, behavior: "smooth" });
  };

  useEffect(() => {
    if (artistRailPaused || artists.length < 2 || activeScreen !== "home") return;
    const timer = window.setInterval(() => moveArtistRail(1), 3200);
    return () => window.clearInterval(timer);
  }, [artistRailPaused, artists.length, activeScreen]);

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
    const accountType = modal === "signup" ? String(formData.get("accountType") || "fan") : "";
    setAuthBusy(true);
    setAuthMessage("");
    try {
      const result = modal === "signup"
        ? await authClient.signUp.email({ name, email, password })
        : await authClient.signIn.email({ email, password });
      if (result?.error) throw new Error(result.error.message || "Authentication failed.");
      const sessionResult = await authClient.getSession();
      if (sessionResult?.data?.user) setCurrentUser(sessionResult.data.user);
      if (modal === "signup") {
        window.localStorage.setItem("nochalant_pending_account_type", accountType);
      }
      const pendingAccountType = modal === "signup" ? accountType : window.localStorage.getItem("nochalant_pending_account_type");
      if (pendingAccountType && sessionResult?.data?.user) {
        try {
          const token = await getAuthToken();
          if (token) {
            const profileResponse = await fetch("/api/account/type", {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
              body: JSON.stringify({ accountType: pendingAccountType })
            });
            const profileData = await profileResponse.json().catch(() => ({}));
            if (!profileResponse.ok || !profileData.ok) throw new Error(profileData.error || "Account type could not be saved.");
            window.localStorage.removeItem("nochalant_pending_account_type");
          }
        } catch (profileError) {
          console.warn("Account type will be retried after sign-in:", profileError?.message || profileError);
        }
      }
      setAuthMessage(modal === "signup" ? "Account created. Your selected account type will be activated when your profile is ready." : "You are signed in.");
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
    const formData = new FormData(form);
    const payload = { title: String(formData.get("title") || "").trim(), body: String(formData.get("body") || "").trim(), category: String(formData.get("category") || ""), sourceUrl: String(formData.get("sourceUrl") || "").trim(), anonymous: true };
    try {
      const response = await fetch("/api/submissions", { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(payload) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok) throw new Error(data.error || "We couldn't submit your anonymous gist.");
      form.reset(); setFormCategory("Entertainment"); closeModal();
      notify("Your anonymous gist is safely in the editorial review archive.");
    } catch (error) { notify(error?.message || "Submission failed. Please try again."); }
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
      <nav className={mobileMenu ? "main-nav open" : "main-nav"}>
        <div className="drawer-flagship"><span className="drawer-kicker">NOCHALANT FLAGSHIP</span>
          <button onClick={() => {setMobileMenu(false);setActiveScreen("home");window.scrollTo({top:0,behavior:"smooth"});}}>Home <span>01</span></button>
          <button onClick={() => {setMobileMenu(false);setActiveScreen("social");window.scrollTo({top:0,behavior:"smooth"});}}>Social <span>02</span></button>
          <a href="#artists" onClick={() => setMobileMenu(false)}>Discover <span>03</span></a>
          <button onClick={() => {setMobileMenu(false);setActiveScreen("podcast");window.scrollTo({top:0,behavior:"smooth"});}}>Podcast <span>04</span></button>
          {currentUser?.id && accountProfile?.profile?.account_type === "artist" ? <button onClick={() => {setMobileMenu(false);setActiveScreen("dashboard");window.scrollTo({top:0,behavior:"smooth"});}}>Artist Studio <span>05</span></button> : <a href="#artists" onClick={() => setMobileMenu(false)}>Artists <span>05</span></a>}
          <a href="#agenda" onClick={() => setMobileMenu(false)}>Agenda <span>06</span></a>
          <a href="#agenda" onClick={() => setMobileMenu(false)}>Events <span>07</span></a>
          <a href="#artists" onClick={() => setMobileMenu(false)}>Bookings <span>08</span></a>
          <button onClick={() => {setMobileMenu(false);setModal("submit");}}>Submit <span>09</span></button>
        </div><div className="drawer-quick"><span className="drawer-kicker">QUICK ACCESS</span><a href="#latest" onClick={() => setMobileMenu(false)}>Latest gist</a><a href="#categories" onClick={() => setMobileMenu(false)}>Categories</a><a href="#hot-or-trash" onClick={() => setMobileMenu(false)}>Hot or Trash</a><button onClick={() => {setMobileMenu(false);if (!currentUser) setModal("login");else {setOpinionsPanelMode("dashboard");setOpinionsPanelOpen(true);}}}>My Opinions</button></div></nav>
      <div className="nav-actions">{currentUser && <button className="text-button nav-login" onClick={() => {setActiveScreen("dashboard");setMobileMenu(false);window.scrollTo({top:0,behavior:"smooth"});}}>My dashboard</button>}{currentUser ? <button className="text-button nav-login" onClick={signOutUser}>Log out</button> : <button className="text-button nav-login" onClick={() => setModal("login")}>Log in</button>}<button className="nav-spill" onClick={() => setModal("submit")}><span>Spill the tea</span></button>{!currentUser && <button className="nav-join" onClick={() => setModal("signup")}><span>Join Nochalant</span></button>}</div>
    </div></header>
    

    <main id="top">
      {activeScreen === "home" ? <>
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
            <div className="lead-story-top"><span className="pill pill-hot">HOT DROP</span><span className="demo-label">EDITORIAL PREVIEW</span><button className="lead-next-overlay" type="button" onClick={e => {e.stopPropagation();changeLeadSlide(leadSlide+1);}}>NEXT »</button></div>
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
        <div className="artists-viewport" ref={artistRailRef} aria-label="Artists on Nochalant. Swipe or use the arrow controls to browse artists." tabIndex="0" onMouseEnter={() => setArtistRailPaused(true)} onMouseLeave={() => setArtistRailPaused(false)} onFocus={() => setArtistRailPaused(true)} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setArtistRailPaused(false); }} onTouchStart={() => setArtistRailPaused(true)} onTouchEnd={() => setArtistRailPaused(false)}>
          {artists.length > 0 ? <div className="artists-track">{artists.map(artist => <a className="artist-card" key={artist.id} href={artist.profile_url || "#artists"} target={artist.profile_url ? "_blank" : undefined} rel={artist.profile_url ? "noreferrer" : undefined}>
            <span className="artist-avatar">{artist.image_url ? <img src={artist.image_url} alt={`${artist.name} artist portrait`} loading="lazy" /> : <span>{artist.name?.trim().slice(0,1).toUpperCase() || "A"}</span>}</span>
            <span className="artist-name">{artist.name}</span>
            {artist.genre && <span className="artist-genre">{artist.genre}</span>}
            {Number.isFinite(Number(artist.download_count)) && <span className="artist-downloads" aria-label={`${Number(artist.download_count).toLocaleString()} downloads`}><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1.5v8m0 0 3-3m-3 3-3-3M2.5 11v2.5h11V11"/></svg>{Number(artist.download_count).toLocaleString()}</span>}
          </a>)}</div> : <div className="artists-empty">{artistsLoading ? "Loading artists…" : "The artist spotlight is getting ready. Check back soon."}</div>}
        </div>
      </section>

      <section className="section container" id="latest"><div className="section-heading"><div><div className="eyebrow">FRESH FROM THE CULTURE</div><h2>Latest <em>crispy gist.</em></h2></div><span className="demo-label">SAMPLE CONTENT · NOT LIVE NEWS</span></div>
        <div className="filter-row" id="categories"><div className="category-tabs">{categories.map(item => <button key={item} className={category === item ? "category-tab active" : "category-tab"} onClick={() => setCategory(item)}>{item}</button>)}</div><label className="search-box"><span aria-hidden="true">⌕</span><input aria-label="Search stories" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search the gist"/></label></div>
        <div className="story-grid">{filtered.map(item => <article className="story-card" key={item.id} role="button" tabIndex="0" aria-label={`Open story: ${item.title}`} onClick={() => openStory(item)} onKeyDown={e => e.key === "Enter" && e.target === e.currentTarget && openStory(item)}><div className="story-image"><img src={item.image} alt=""/><span className="story-category">{item.category}</span></div><div className="story-content"><div className="story-meta"><span>{item.time}</span><span>{item.read}</span></div><h3>{item.title}</h3><div className="story-byline"><span>By {item.author}</span><span>{typeof viewCounts[item.id] === "number" ? `${viewCounts[item.id].toLocaleString()} views` : "Views loading"}</span></div><div className="story-foot"><button className={likes[item.id] ? "like-action liked" : "like-action"} onClick={e => {e.stopPropagation();toggleLike(item.id);}} aria-pressed={!!likes[item.id]}>♡ {likes[item.id] ? "Liked" : "Like"}</button><span>◌ {comments[item.id]?.length || 0} comments</span><b>Full gist </b></div></div></article>)}{filtered.length === 0 && <div className="empty-state">No stories in this category yet. Check back soon.</div>}</div>
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
      </> : activeScreen === "social" ? <section className="social-section container screen-page" id="social" aria-labelledby="social-title"><SocialFeed currentUser={currentUser} onJoin={() => setModal("signup")} onShare={() => { if (!currentUser) setModal("login"); else { setOpinionsPanelMode("dashboard"); setOpinionsPanelOpen(true); } }} /></section> : activeScreen === "podcast" ? <section className="podcast-section container screen-page" id="podcast-show" aria-labelledby="podcast-show-title">
        <div className="podcast-heading"><div><span className="eyebrow">ORIGINALS · NOCHALANT STUDIOS</span><h1 id="podcast-show-title">Nochalant <em>Podcast.</em></h1><p>Watch the conversations, performances and stories moving Nigerian culture.</p></div><span className="podcast-mark" aria-hidden="true">N<span>.</span></span></div>
        <div className="podcast-library-feature">
          <div className="podcast-library-screen"><span className="podcast-screen-mark">N.</span><strong>{podcastDisplayItems[selectedPodcastIndex].label.split(" ").slice(0,1).join(" ")}<br/>{podcastDisplayItems[selectedPodcastIndex].label.split(" ").slice(1).join(" ")}</strong><span>FULL EPISODES · CLIPS · SESSIONS</span></div>
          <div className="podcast-library-copy"><span className="eyebrow">NOW SELECTED · {String(selectedPodcastIndex+1).padStart(2,"0")} / {String(podcastDisplayItems.length).padStart(2,"0")}</span><h2>{podcastDisplayItems[selectedPodcastIndex].title} <em>on Nochalant.</em></h2><p>{podcastDisplayItems[selectedPodcastIndex].description} Published episodes will appear here when available.</p><span className="podcast-status">EPISODES COMING SOON</span></div>
        </div>
        <div className="podcast-selection-nav" aria-label="Choose a podcast series"><button type="button" onClick={() => setPodcastSelection(index => (index - 1 + podcastDisplayItems.length) % podcastDisplayItems.length)} aria-label="Previous podcast series">← <span>PREVIOUS</span></button><span>CHOOSE A SERIES</span><button type="button" onClick={() => setPodcastSelection(index => (index + 1) % podcastDisplayItems.length)} aria-label="Next podcast series"><span>NEXT</span> →</button></div>
        <div className="podcast-library-tabs"><span>ALL EPISODES</span><span>SEASONS</span><span>SESSIONS</span><span>CLIPS</span></div>
        <div className="podcast-library-grid">{podcastDisplayItems.map((item,index) => <button type="button" key={item.title} className={selectedPodcastIndex === index ? "podcast-library-card is-selected" : "podcast-library-card"} onClick={() => setPodcastSelection(index)} aria-pressed={selectedPodcastIndex === index}><div className={item.art}><span>{String(index+1).padStart(2,"0")}</span><b>{item.label}</b></div><div><strong>{item.title}</strong><p>{item.subtitle}</p></div></button>)}</div>
      </section> : activeScreen === "dashboard" ? <section className="account-dashboard container screen-page" aria-labelledby="account-dashboard-title"><div className="account-dashboard-head"><div><span className="eyebrow">YOUR NOCHALANT SPACE</span><h1 id="account-dashboard-title">Your dashboard<span>.</span></h1><p>Welcome back, {accountProfile?.profile?.display_name || currentUser?.name || "member"}.</p></div><span className="account-type-chip">{(accountProfile?.profile?.account_type || "fan").replaceAll("_"," ")}</span></div>{accountProfileLoading ? <div className="account-dashboard-loading">Loading your account tools…</div> : <><div className="account-dashboard-grid"><article className="account-dashboard-card account-dashboard-primary"><span className="eyebrow">ACCOUNT TYPE</span><h2>{({fan:"Fan & Listener",artist:"Artist / Musician",creator:"Creator / Influencer",event_organizer:"Event Organizer",business:"Business / Brand",media:"Media / Publisher"})[accountProfile?.profile?.account_type || "fan"]}</h2><p>Your dashboard is organized around the account type you selected. Your account type does not grant editorial or verification privileges.</p></article>{(accountProfile?.profile?.account_type || "fan") === "artist" ? <><article className="account-dashboard-card"><span className="eyebrow">ARTIST PROFILE</span><h3>{artistStudio?.artist?.stage_name || accountProfile?.artistProfile?.stage_name || "Your artist identity"}</h3><p>Verification: {artistStudio?.artist?.verification_status || accountProfile?.artistProfile?.verification_status || "unverified"}. Public verification is reviewed separately by Nochalant.</p><span className="dashboard-status">{(artistStudio?.artist?.verification_status || "unverified").toUpperCase()}</span></article><article className="account-dashboard-card"><span className="eyebrow">MUSIC CATALOGUE</span><h3>{artistStudio?.releases?.length || 0} release drafts &amp; submissions</h3><p>{artistStudio?.stats?.published_tracks || 0} published tracks · {Number(artistStudio?.stats?.downloads || 0).toLocaleString()} recorded downloads</p><span className="dashboard-status">LIVE ACCOUNT DATA</span></article></> : (accountProfile?.profile?.account_type || "fan") === "creator" ? <><article className="account-dashboard-card"><span className="eyebrow">CREATOR PROFILE</span><h3>Your public portfolio</h3><p>Build your creator identity, showcase work and connect with your audience.</p><span className="dashboard-status">PROFILE TO SET UP</span></article><article className="account-dashboard-card"><span className="eyebrow">BOOKINGS</span><h3>Enquiries &amp; bookings</h3><p>Manage service details, availability and booking requests.</p><span className="dashboard-status">BOOKING TOOLS IN DEVELOPMENT</span></article></> : (accountProfile?.profile?.account_type || "fan") === "event_organizer" ? <><article className="account-dashboard-card"><span className="eyebrow">EVENTS</span><h3>Your event listings</h3><p>Create event details, submit them for review and manage approved listings.</p><span className="dashboard-status">EVENT TOOLS IN DEVELOPMENT</span></article><article className="account-dashboard-card"><span className="eyebrow">ATTENDANCE</span><h3>Tickets &amp; guests</h3><p>Track event interest and attendance when ticketing is enabled.</p><span className="dashboard-status">TICKETING NOT CONNECTED</span></article></> : (accountProfile?.profile?.account_type || "fan") === "business" ? <><article className="account-dashboard-card"><span className="eyebrow">BRAND PROFILE</span><h3>Your business presence</h3><p>Showcase your brand, services and approved promotions.</p><span className="dashboard-status">PROFILE TO SET UP</span></article><article className="account-dashboard-card"><span className="eyebrow">PROMOTIONS</span><h3>Campaigns</h3><p>Prepare sponsored placements with transparent labels and editorial review.</p><span className="dashboard-status">CAMPAIGN TOOLS IN DEVELOPMENT</span></article></> : (accountProfile?.profile?.account_type || "fan") === "media" ? <><article className="account-dashboard-card"><span className="eyebrow">PUBLISHER PROFILE</span><h3>Media submissions</h3><p>Manage publisher identity and submit coverage for editorial consideration.</p><span className="dashboard-status">PUBLISHER TOOLS IN DEVELOPMENT</span></article></> : <><article className="account-dashboard-card"><span className="eyebrow">YOUR ACTIVITY</span><h3>Saved culture &amp; follows</h3><p>Keep up with artists, creators, conversations and events you follow.</p><span className="dashboard-status">MEMBER TOOLS IN DEVELOPMENT</span></article><article className="account-dashboard-card"><span className="eyebrow">COMMUNITY</span><h3>Social &amp; opinions</h3><p>Join conversations, share posts and take part in community voting.</p><span className="dashboard-status">MEMBER ACCESS</span></article></>}</div>{(accountProfile?.profile?.account_type || "fan") === "artist" && <div className="artist-studio-tools"><div className="artist-studio-heading"><div><span className="eyebrow">ARTIST WORKSPACE</span><h2>Manage your <em>sound.</em></h2><p>Build your artist identity and prepare music releases for review.</p></div></div>{artistStudioError && <p className="artist-studio-error" role="alert">{artistStudioError}</p>}<div className="artist-studio-forms"><form className="artist-studio-form" onSubmit={e => submitArtistStudio(e,"update_profile")}><h3>Artist profile</h3><label>Stage / artist name<input name="stageName" required maxLength="100" defaultValue={artistStudio?.artist?.stage_name || ""}/></label><label>Short biography<textarea name="bio" rows="4" maxLength="3000" defaultValue={artistStudio?.artist?.bio || ""}/></label><label>City<input name="city" maxLength="100" defaultValue={artistStudio?.artist?.city || ""}/></label><label>Profile image HTTPS URL<input name="avatarUrl" type="url" defaultValue={artistStudio?.artist?.avatar_url || ""} placeholder="https://..."/></label><label>Banner image HTTPS URL<input name="bannerUrl" type="url" defaultValue={artistStudio?.artist?.banner_url || ""} placeholder="https://..."/></label><button className="button button-green" disabled={artistStudioBusy}>{artistStudioBusy ? "Saving…" : "Save artist profile"}</button></form><form className="artist-studio-form" onSubmit={e => submitArtistStudio(e,"create_release")}><h3>Start a music release</h3><label>Release title<input name="title" required maxLength="180" placeholder="Your single or album title"/></label><label>Release type<select name="releaseType" defaultValue="single"><option value="single">Single</option><option value="ep">EP</option><option value="album">Album</option><option value="mixtape">Mixtape</option></select></label><label>Genre<input name="genre" required maxLength="80" placeholder="Afrobeats, Amapiano…"/></label><label>Release date<input name="releaseDate" type="date"/></label><label>Cover artwork HTTPS URL<input name="coverArtUrl" type="url" placeholder="https://..."/></label><button className="button button-green" disabled={artistStudioBusy}>{artistStudioBusy ? "Saving…" : "Save release draft"}</button><small className="fine-print">Audio upload and rights-document submission are not enabled yet. A saved draft is not published.</small></form></div><div className="artist-release-list"><h3>Your releases</h3>{artistStudio?.releases?.length ? artistStudio.releases.map(release => <div className="artist-release-row" key={release.id}><div><strong>{release.title}</strong><small>{release.release_type.toUpperCase()} · {release.genre} · {release.track_count} tracks</small></div><span className="dashboard-status">{release.status.toUpperCase()}</span>{release.status === "draft" && <button className="button button-outline" disabled={artistStudioBusy} onClick={async () => {setArtistStudioBusy(true);try{const token=await getAuthToken();const response=await fetch("/api/artist/studio",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},body:JSON.stringify({action:"submit_release",releaseId:release.id})});const data=await response.json().catch(()=>({}));if(!response.ok||!data.ok)throw new Error(data.error||"Release could not be submitted.");const refreshed=await fetch("/api/artist/studio",{headers:{Authorization:`Bearer ${token}`},cache:"no-store"});const latest=await refreshed.json().catch(()=>({}));if(refreshed.ok&&latest.ok)setArtistStudio(latest);notify("Release sent for editorial review.");}catch(error){setArtistStudioError(error.message||"Release submission failed.");}finally{setArtistStudioBusy(false);}}}>Submit for review</button>}</div>) : <p className="fine-print">No releases yet. Create your first release draft above.</p>}</div></div>}<div className="account-dashboard-footer"><button className="button button-outline" onClick={() => setActiveScreen("home")}>Back to Nochalant</button></div></>}</section> : null}
    </main>
    {activeScreen === "home" && (
      <section className="home-podcast-section container" aria-labelledby="home-podcast-title">
              <div className="home-podcast-head"><div><span className="eyebrow">NOCHALANT PODCAST</span><h2 id="home-podcast-title">Watch the <em>latest episode.</em></h2><p>Unfiltered conversations. Culture. Music. People. Only on Nochalant Podcast.</p></div><button className="podcast-see-more" onClick={() => {setActiveScreen("podcast");window.scrollTo({top:0,behavior:"smooth"});}}>See more <span>→</span></button></div>
              <div className="podcast-feature-player"><div className="podcast-screen"><div className="podcast-screen-brand"><span className="podcast-screen-mark">N.</span><strong>NOCHALANT<br/>PODCAST</strong></div><span className="podcast-screen-status">NOCHALANT ORIGINALS · EPISODES COMING SOON</span></div><div className="podcast-player-meta"><div><span className="podcast-status">FEATURED SHOW</span><h3>Nochalant Podcast</h3><p>Original conversations from the culture desk</p></div><button type="button" className="podcast-play-disabled" disabled aria-label="Episode playback will be available when the first episode is published">▶</button></div></div>

    )}

    {activeScreen === "home" && <section className="newsletter-section container" aria-labelledby="newsletter-title">
      <div className="newsletter-copy"><span className="eyebrow">THE NOCHALANT DROP</span><h2 id="newsletter-title">The gist, straight to <em>you.</em></h2><p>Fresh stories, new music and what's happening next. No noise.</p></div>
      <form className="newsletter-form" onSubmit={e => {e.preventDefault();setModal("newsletter-success");}}>
        <label className="sr-only" htmlFor="newsletter-email">Your email address</label>
        <input id="newsletter-email" type="email" required value={newsletterEmail} onChange={e => setNewsletterEmail(e.target.value)} placeholder="Your email address"/>
        <button type="submit">Gimme Update</button>
      </form>
    </section>}
    <footer className="footer"><div className="container footer-main footer-main-expanded"><div className="footer-about"><a className="brand footer-brand" href="#top"><span className="footer-brand-mark" aria-hidden="true"><svg viewBox="0 0 48 48"><path d="M13 35V13h7l9 13V13h7v22h-7l-9-13v13z"/><path d="M9 7h30v34H9z"/></svg></span><span className="footer-brand-word">NOCHALANT<span>.COM</span></span></a><p>Nigeria’s premier high-energy entertainment network. Bringing you the hottest Afrobeats gist, Nollywood drama, and street buzz with zero form!</p></div><div className="footer-column"><h3>QUICK NAVIGATION</h3><a href="#latest">Afrobeats Top 50</a><a href="#latest">Nollywood Box Office</a><a href="#hot-or-trash">BBNaija Highlights</a><a href="#latest">Celebrity Fashion &amp; Glam</a></div><div className="footer-column footer-confidential"><h3>GOT CONFIDENTIAL GIST?</h3><p>Drop hot tips, video evidence or street gist anonymously. No account or registration needed.</p><button className="footer-anonymous" onClick={() => setModal("submit")}><svg className="anonymous-mark" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 10h18M5 10l1.5-5h11L19 10M7 14a3 3 0 1 0 6 0M11 14a3 3 0 1 0 6 0M3 14h2m14 0h2"/></svg><span>Spill Anonymous Gist</span></button><div className="footer-social"><h3>CONNECT WITH THE SWAG</h3><div className="footer-social-links"><a href="https://www.instagram.com/" target="_blank" rel="noreferrer" aria-label="Instagram"><svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1"/></svg></a><a href="https://www.facebook.com/" target="_blank" rel="noreferrer" aria-label="Facebook"><svg viewBox="0 0 24 24"><path d="M14 21v-8h3l.5-4H14V7c0-1.2.4-2 2-2h2V1.4C17.2 1.2 16.1 1 15 1c-3.3 0-5.5 2-5.5 5.7V9H6v4h3.5v8z"/></svg></a><a href="https://www.tiktok.com/" target="_blank" rel="noreferrer" aria-label="TikTok"><svg viewBox="0 0 24 24"><path d="M15 3c.4 2.2 1.7 3.5 4 3.7v3.2a8 8 0 0 1-4-1.2v6.5a6 6 0 1 1-6-6h1v3.4h-1a2.6 2.6 0 1 0 2.6 2.6V3z"/></svg></a><a href="https://www.youtube.com/" target="_blank" rel="noreferrer" aria-label="YouTube"><svg viewBox="0 0 24 24"><path d="M23 7a3 3 0 0 0-2-2C19 4.5 12 4.5 12 4.5s-7 0-9 .5a3 3 0 0 0-2 2A31 31 0 0 0 .5 12 31 31 0 0 0 1 17a3 3 0 0 0 2 2c2 .5 9 .5 9 .5s7 0 9-.5a3 3 0 0 0 2-2 31 31 0 0 0 .5-5A31 31 0 0 0 23 7zM10 15.5v-7l6 3.5z"/></svg></a></div></div></div></div><div className="container footer-bottom"><span>© 2026 Nochalant Media Nigeria Ltd. All Rights Reserved.</span><span className="footer-credit">Powered by Squadglobal.</span></div></footer>

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
      {modal === "submit" && <><span className="eyebrow">YOUR STORY. YOUR PLATFORM.</span><h2 id="modal-title">Spill the <em>gist.</em></h2><p className="modal-intro">Send a tip or story anonymously. No account, sign-in or registration is required. Every anonymous gist is archived privately for editorial review, with a target review window of up to 7 days.</p><form onSubmit={submitGist}><label>Category<select name="category" value={submissionCategories.includes(formCategory) ? formCategory : "Entertainment"} onChange={e => setFormCategory(e.target.value)}>{submissionCategories.map(x => <option key={x} value={x}>{x}</option>)}</select></label><label>Post title<input name="title" required minLength="8" maxLength="180" placeholder="Give your gist a clear title"/></label><label>Tell us the full gist<textarea name="body" required minLength="20" maxLength="12000" rows="5" placeholder="Add details, links and useful context..."/></label><label>Source link (optional)<input name="sourceUrl" type="url" placeholder="https://..."/></label><label className="check-label"><input type="checkbox" required/> I confirm this submission is accurate and I have permission to share its content.</label><button className="button button-green full-width" type="submit">Send anonymous gist</button><small className="fine-print">Your identity is not requested. Your submission remains private and pending until an editor reviews it.</small></form></>}
      {(modal === "signup" || modal === "login") && <><span className="eyebrow">JOIN THE CULTURE</span><h2 id="modal-title">{modal === "signup" ? "Create your account." : "Welcome back."}</h2><p className="modal-intro">Sign in or create your Nochalant account securely.</p><form onSubmit={submitAuth}>{modal === "signup" && <><label>Full name<input name="name" required placeholder="Your name"/></label><label>Choose your account type<select name="accountType" defaultValue="fan"><option value="fan">Fan / Listener</option><option value="artist">Artist / Musician</option><option value="creator">Creator / Influencer</option><option value="event_organizer">Event Organizer</option><option value="business">Business / Brand</option><option value="media">Media / Publisher</option></select></label><small className="fine-print">Your account type personalizes your dashboard and tools. Artist verification and publishing approval are separate steps.</small></>}<label>Email address<input name="email" type="email" required placeholder="you@example.com"/></label><label>Password<input name="password" type="password" required minLength="8" placeholder="At least 8 characters"/></label><button className="button button-green full-width" type="submit" disabled={authBusy}>{authBusy ? "Please wait…" : modal === "signup" ? "Create account" : "Log in"}</button>{authMessage && <small className="fine-print" role="status">{authMessage}</small>}</form><button className="switch-modal" onClick={() => setModal(modal === "signup" ? "login" : "signup")}>{modal === "signup" ? "Already registered? Log in" : "New here? Register"}</button></>}
    </div></div>}
    {selectedOpinion && <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && setSelectedOpinion(null)}><div className="modal-card opinion-detail" role="dialog" aria-modal="true" aria-labelledby="opinion-detail-title"><button className="modal-close" onClick={() => setSelectedOpinion(null)} aria-label="Close opinion">×</button><span className="eyebrow">{selectedOpinion.topic} · NOCHALANT OPINION</span><h2 id="opinion-detail-title">The people have a say.</h2><blockquote>“{selectedOpinion.body}”</blockquote><p className="opinion-author-detail">Shared by {selectedOpinion.author_name}</p><div className="opinion-detail-actions"><button className="button button-outline full-width" onClick={() => {if (!currentUser) {setSelectedOpinion(null);setModal("login");setAuthMessage("Log in to report content.");} else {setReportOpinion(selectedOpinion);setSelectedOpinion(null);setOpinionsPanelMode("report");setOpinionsPanelOpen(true);}}}>Report this opinion</button><button className="button button-green full-width" onClick={() => {setSelectedOpinion(null);if (!currentUser) setModal("login");else {setOpinionsPanelMode("dashboard");setOpinionsPanelOpen(true);}}}>Share your take</button></div></div></div>}
    <OpinionsPanel open={opinionsPanelOpen} mode={opinionsPanelMode} opinion={reportOpinion} onClose={() => setOpinionsPanelOpen(false)} onNotice={notify} />
    {toast && <div className="toast" role="status">{toast}</div>}
  </div>;
}
createRoot(document.getElementById("root")).render(<App />);
