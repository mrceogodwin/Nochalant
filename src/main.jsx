import React, { Suspense, lazy, useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import { authClient, getAuthToken, rememberAuthSession, clearRememberedAuthSession } from "./auth.js";
const OpinionsPanel = lazy(() => import("./OpinionsPanel.jsx"));
const SocialFeed = lazy(() => import("./SocialFeed.jsx"));
const PodcastAdmin = lazy(() => import("./PodcastAdmin.jsx"));
const SocialSettingsAdmin = lazy(() => import("./SocialSettingsAdmin.jsx"));
const DeferredPanel = ({ children }) => <Suspense fallback={<div className="deferred-panel-loading" role="status">Loading Nochalant…</div>}>{children}</Suspense>;

const categories = ["All Gist", "Afrobeats & Jamz", "Nollywood Drama", "BBNaija / Reality", "Fashion & Swag", "Street Buzz", "Lifestyle", "Agenda"];
const submissionCategories = ["Lifestyle", "Clubs & Nightlife", "Entertainment", "Music", "Nollywood", "Street Buzz", "Business", "Agenda"];
const ACCOUNT_TYPE_LABELS = { fan: "Fan / Listener", artist: "Artist / Musician", creator: "Creator / Influencer", event_organizer: "Event Organizer", business: "Business / Brand", media: "Media / Publisher" };
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
  const [appSkin, setAppSkin] = useState(() => { try { return localStorage.getItem("nochalant:skin") === "light" ? "light" : "dark"; } catch { return "dark"; } });
  const [stickyHeaderEnabled, setStickyHeaderEnabled] = useState(() => { try { return localStorage.getItem("nochalant:sticky-header") !== "off"; } catch { return true; } });
  const [memberDockEnabled, setMemberDockEnabled] = useState(() => { try { return localStorage.getItem("nochalant:member-dock") !== "off"; } catch { return true; } });
  useEffect(() => { try { localStorage.setItem("nochalant:skin", appSkin); } catch {} }, [appSkin]);
  useEffect(() => { try { localStorage.setItem("nochalant:sticky-header", stickyHeaderEnabled ? "on" : "off"); } catch {} }, [stickyHeaderEnabled]);
  useEffect(() => { try { localStorage.setItem("nochalant:member-dock", memberDockEnabled ? "on" : "off"); } catch {} }, [memberDockEnabled]);
  useEffect(() => {
    document.body.classList.toggle("navigation-drawer-open", mobileMenu);
    return () => document.body.classList.remove("navigation-drawer-open");
  }, [mobileMenu]);

  const [activeScreen, setActiveScreen] = useState("home");
  const audioRef = useRef(null);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioCurrent, setAudioCurrent] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioVolume, setAudioVolume] = useState(0.8);
  const [audioError, setAudioError] = useState(false);
  const [audioPlayerVisible, setAudioPlayerVisible] = useState(true);
  const [playerButtonPosition, setPlayerButtonPosition] = useState(null);
  const [playerDockPosition, setPlayerDockPosition] = useState(null);
  const [playerDockDragging, setPlayerDockDragging] = useState(false);
  const playerDockDragRef = useRef(null);
  const handlePlayerDockPointerDown = event => {
    if (event.button !== undefined && event.button !== 0) return;
    if (event.target.closest("button,input,a,select,textarea,.player-progress,.player-queue-controls")) return;
    const rect = event.currentTarget.getBoundingClientRect();
    playerDockDragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      moved: false
    };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };
  const handlePlayerDockPointerMove = event => {
    const drag = playerDockDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (!drag.moved && Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) < 5) return;
    drag.moved = true;
    setPlayerDockDragging(true);
    const rect = event.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    setPlayerDockPosition({
      left: Math.max(8, Math.min(window.innerWidth - width - 8, event.clientX - drag.offsetX)),
      top: Math.max(8, Math.min(window.innerHeight - height - 8, event.clientY - drag.offsetY))
    });
  };
  const handlePlayerDockPointerUp = event => {
    if (playerDockDragRef.current?.pointerId === event.pointerId) {
      playerDockDragRef.current = null;
      setPlayerDockDragging(false);
    }
  };

  const playerButtonDragRef = useRef(null);
  const playerButtonDraggedRef = useRef(false);
  const handlePlayerButtonPointerDown = event => {
    if (event.button !== undefined && event.button !== 0) return;
    event.preventDefault();
    playerButtonDraggedRef.current = false;
    const rect = event.currentTarget.getBoundingClientRect();
    playerButtonDragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top
    };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };
  const handlePlayerButtonPointerMove = event => {
    const drag = playerButtonDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) < 5 && !playerButtonDraggedRef.current) return;
    playerButtonDraggedRef.current = true;
    const size = 66;
    setPlayerButtonPosition({
      left: Math.max(8, Math.min(window.innerWidth - size - 8, event.clientX - drag.offsetX)),
      top: Math.max(8, Math.min(window.innerHeight - size - 8, event.clientY - drag.offsetY))
    });
  };
  const handlePlayerButtonPointerUp = event => {
    if (playerButtonDragRef.current?.pointerId === event.pointerId) playerButtonDragRef.current = null;
  };
  useEffect(() => {
    const clampPlayerButton = () => setPlayerButtonPosition(position => position ? ({
      left: Math.max(8, Math.min(window.innerWidth - 74, position.left)),
      top: Math.max(8, Math.min(window.innerHeight - 74, position.top))
    }) : position);
    window.addEventListener("resize", clampPlayerButton);
    return () => window.removeEventListener("resize", clampPlayerButton);
  }, []);
  const [formCategory, setFormCategory] = useState("Afrobeats & Jamz");
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [authMessage, setAuthMessage] = useState("");
  const [viewCounts, setViewCounts] = useState({});
  const [communityFaces, setCommunityFaces] = useState(demoFaces);
  const [artists, setArtists] = useState([]);
  const [artistsLoading, setArtistsLoading] = useState(true);
  const [selectedArtist, setSelectedArtist] = useState(null);
  const [artistProfileLoading, setArtistProfileLoading] = useState(false);
  const [artistProfileError, setArtistProfileError] = useState("");
  const [audioQueue, setAudioQueue] = useState([]);
  const [audioQueueIndex, setAudioQueueIndex] = useState(0);
  const [activeAudioTrack, setActiveAudioTrack] = useState(null);
  const trackedPlaysRef = useRef(new Set());
  const playbackTicketRef = useRef({ trackId: null, ticket: null, issuing: false });
  const artistRailRef = useRef(null);
  const [artistRailPaused, setArtistRailPaused] = useState(false);
  const [opinions, setOpinions] = useState([]);
  const [selectedOpinion, setSelectedOpinion] = useState(null);
  const [opinionSlide, setOpinionSlide] = useState(0);
  const [currentUser, setCurrentUser] = useState(null);
  const [accountProfile, setAccountProfile] = useState(null);
  const [accountProfileLoading, setAccountProfileLoading] = useState(false);
  const [accountProfileRefresh, setAccountProfileRefresh] = useState(0);
  const [accountProfileError, setAccountProfileError] = useState("");
  const [memberProfileBusy, setMemberProfileBusy] = useState(false);
  const [artistStudio, setArtistStudio] = useState(null);
  const [artistStudioError, setArtistStudioError] = useState("");
  const [artistStudioBusy, setArtistStudioBusy] = useState(false);
  const [promotionPackage, setPromotionPackage] = useState("image_7d");
  const [promotionPackageChosen, setPromotionPackageChosen] = useState(false);
  const [promotionKind, setPromotionKind] = useState("image");
  const [textPromotionBody, setTextPromotionBody] = useState("");
  const [textPromotionDesign, setTextPromotionDesign] = useState({theme:"midnight",layout:"editorial",alignment:"left",icon:"spark",font:"modern"});
  const [promotionBusy, setPromotionBusy] = useState(false);
  const [promotionMessage, setPromotionMessage] = useState("");
  const [promotionCampaigns, setPromotionCampaigns] = useState([]);
  const [promotionAdminQueue, setPromotionAdminQueue] = useState([]);
  const [myPromotionCampaigns, setMyPromotionCampaigns] = useState([]);
  const [promotionAdminBusy, setPromotionAdminBusy] = useState(false);
  const [isControlRoom] = useState(() => window.location.pathname.replace(/\/+$/, "") === "/control-room");
  const [controlRoomStatus, setControlRoomStatus] = useState("checking");
  const [controlRoomError, setControlRoomError] = useState("");
  const [opinionsPanelOpen, setOpinionsPanelOpen] = useState(false);
  const [opinionsPanelMode, setOpinionsPanelMode] = useState("dashboard");
  const [reportOpinion, setReportOpinion] = useState(null);
  const [podcastSelection, setPodcastSelection] = useState(0);
  const [activePodcastEpisode, setActivePodcastEpisode] = useState(null);
  const [podcastCatalogue, setPodcastCatalogue] = useState({ shows: [], seasons: [], episodes: [], clips: [] });
  const [podcastCatalogueLoading, setPodcastCatalogueLoading] = useState(false);
  const [selectedPodcastHost, setSelectedPodcastHost] = useState(null);
  const [memberDockHidden, setMemberDockHidden] = useState(false);
  const [memberDockTab, setMemberDockTab] = useState("home");
  const [musicTab, setMusicTab] = useState("discover");
  const [musicGenre, setMusicGenre] = useState("All genres");
  const [musicSearch, setMusicSearch] = useState("");
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
    const onPlay = () => {
      setAudioPlaying(true);
      setAudioError(false);
      const trackId = activeAudioTrack?.id;
      if (!trackId || trackedPlaysRef.current.has(trackId) || playbackTicketRef.current.trackId === trackId) return;
      try {
        let sessionId = window.sessionStorage.getItem("nochalant-audio-session");
        if (!sessionId) {
          sessionId = window.crypto.randomUUID();
          window.sessionStorage.setItem("nochalant-audio-session", sessionId);
        }
        playbackTicketRef.current = { trackId, ticket: null, issuing: true, redeeming: false };
        fetch("/api/artists", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "issue_playback_ticket", trackId, sessionId })
        }).then(response => response.json()).then(data => {
          if (playbackTicketRef.current.trackId !== trackId || !data?.ok || typeof data.ticket !== "string") return;
          playbackTicketRef.current = { trackId, ticket: data.ticket, issuing: false, redeeming: false };
        }).catch(() => {
          if (playbackTicketRef.current.trackId === trackId) playbackTicketRef.current = { trackId: null, ticket: null, issuing: false, redeeming: false };
        });
      } catch {
        playbackTicketRef.current = { trackId: null, ticket: null, issuing: false, redeeming: false };
      }
    };
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
  }, [audioVolume, activeAudioTrack]);

  useEffect(() => {
    if (!activeAudioTrack?.id) return;
    const trackId = activeAudioTrack.id;
    const duration = Number(activeAudioTrack.duration_seconds || audioDuration || 0);
    const threshold = duration > 0 && duration < 30 ? Math.ceil(duration * 0.8) : 30;
    const ticketState = playbackTicketRef.current;
    if (audioCurrent < threshold + 3 || trackedPlaysRef.current.has(trackId) ||
        ticketState.trackId !== trackId || !ticketState.ticket || ticketState.redeeming) return;
    const ticket = ticketState.ticket;
    playbackTicketRef.current = { ...ticketState, redeeming: true };
    fetch("/api/artists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "redeem_playback_ticket", trackId, ticket })
    }).then(response => response.json()).then(data => {
      if (playbackTicketRef.current.trackId !== trackId) return;
      if (data?.ok && (data.counted || data.duplicate)) {
        trackedPlaysRef.current.add(trackId);
        playbackTicketRef.current = { trackId, ticket: null, issuing: false, redeeming: false };
        if (data.counted) {
          setArtists(current => current.map(artist => ({
            ...artist,
            tracks: (artist.tracks || []).map(track => track.id === trackId ? { ...track, plays_count: data.plays_count } : track)
          })));
        }
      } else {
        playbackTicketRef.current = { trackId: null, ticket: null, issuing: false, redeeming: false };
      }
    }).catch(() => {
      if (playbackTicketRef.current.trackId === trackId) {
        playbackTicketRef.current = { trackId: null, ticket: null, issuing: false, redeeming: false };
      }
    });
  }, [audioCurrent, audioDuration, activeAudioTrack]);

  const filtered = useMemo(() => demoStories.slice(1).filter(item =>
    (category === "All Gist" || item.category === category) &&
    (item.title.toLowerCase().includes(search.toLowerCase()) || item.excerpt.toLowerCase().includes(search.toLowerCase()))
  ), [category, search]);

  const notify = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 3000);
  };
  const saveMemberProfile = async event => {
    event.preventDefault();
    if (memberProfileBusy) return;
    setMemberProfileBusy(true);
    try {
      const form = new FormData(event.currentTarget);
      const token = await getAuthToken();
      if (!token) throw new Error("Your session has expired. Please sign in again.");
      let avatarObjectKey = "";
      const avatarFile = form.get("avatar");
      if (avatarFile instanceof File && avatarFile.size > 0) {
        const uploadResponse = await fetch("/api/account/type", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ action: "create_profile_avatar_upload", contentType: avatarFile.type, size: avatarFile.size }),
          cache: "no-store"
        });
        const uploadData = await uploadResponse.json().catch(() => ({}));
        if (!uploadResponse.ok || !uploadData.ok) throw new Error(uploadData.error || "Profile photo upload could not be started.");
        const putResponse = await fetch(uploadData.url, { method: "PUT", headers: uploadData.headers, body: avatarFile });
        if (!putResponse.ok) throw new Error("Profile photo upload failed. Please try again.");
        avatarObjectKey = uploadData.objectKey;
      }
      const response = await fetch("/api/account/type", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          action: "save_profile",
          username: form.get("username"),
          bio: form.get("bio"),
          websiteUrl: form.get("websiteUrl"),
          location: form.get("location"),
          avatarObjectKey
        }),
        cache: "no-store"
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok) throw new Error(data.error || "Your profile could not be saved.");
      setAccountProfile(previous => ({ ...previous, profileDetails: data.profileDetails }));
      notify("Your member profile has been saved.");
    } catch (error) {
      notify(error?.message || "Profile update failed.");
    } finally {
      setMemberProfileBusy(false);
    }
  };
  const startPromotionCheckout = async (campaignId) => {
    setPromotionBusy(true);
    setPromotionMessage("");
    try {
      const token = await getAuthToken();
      if (!token) throw new Error("Please sign in again.");
      const response = await fetch("/api/promotions", { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + token }, body: JSON.stringify({ action: "create_checkout", campaignId }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok || !data.checkoutUrl) throw new Error(data.error || "Checkout could not start.");
      window.location.href = data.checkoutUrl;
    } catch (error) { setPromotionMessage(error.message || "Checkout could not start."); }
    finally { setPromotionBusy(false); }
  };
  const loadPromotionAdminQueue = async () => {
    const token = await getAuthToken();
    if (!token) throw new Error("Administrator session expired. Sign in again.");
    const response = await fetch("/api/promotions", { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + token }, body: JSON.stringify({ action: "admin_queue" }), cache: "no-store" });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.ok) throw new Error(data.error || "Promotion queue could not load.");
    setPromotionAdminQueue(data.campaigns || []);
  };
  const moderatePromotion = async (campaignId, decision) => {
    setPromotionAdminBusy(true);
    try {
      const token = await getAuthToken();
      if (!token) throw new Error("Administrator session expired. Sign in again.");
      const response = await fetch("/api/promotions", { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + token }, body: JSON.stringify({ action: "moderate", campaignId, decision }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok) throw new Error(data.error || "Moderation action failed.");
      await loadPromotionAdminQueue();
      notify(decision === "approve" ? "Promotion approved." : "Promotion rejected.");
    } catch (error) { notify(error.message || "Promotion moderation failed."); }
    finally { setPromotionAdminBusy(false); }
  };
  useEffect(() => {
    if (controlRoomStatus !== "authorized") return;
    loadPromotionAdminQueue().catch(error => notify(error.message || "Promotion queue could not load."));
  }, [controlRoomStatus]);

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

  // Load the persisted account type and profile whenever a member session is restored.
  useEffect(() => {
    if (!currentUser?.id) {
      setAccountProfile(null);
      setAccountProfileLoading(false);
      setAccountProfileError("");
      return;
    }
    const controller = new AbortController();
    setAccountProfileLoading(true);
    setAccountProfileError("");
    (async () => {
      try {
        const token = await getAuthToken();
        if (!token) throw new Error("Your session has expired. Please sign in again.");
        const response = await fetch("/api/account/type", {
          signal: controller.signal,
          headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
          cache: "no-store"
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data.ok) throw new Error(data.error || "Your member profile could not be loaded.");
        if (!controller.signal.aborted) {
          setAccountProfile(data);
          setAccountProfileError("");
        }
      } catch (error) {
        if (error?.name !== "AbortError" && !controller.signal.aborted) setAccountProfileError(error?.message || "Your member profile could not be loaded.");
      } finally {
        if (!controller.signal.aborted) setAccountProfileLoading(false);
      }
    })();
    return () => controller.abort();
  }, [currentUser?.id, accountProfileRefresh]);

  useEffect(() => {
    if (!currentUser?.id) { setMemberDockHidden(false); return; }
    let lastY = window.scrollY;
    let lastDirectionChange = 0;
    const onScroll = () => {
      const y = window.scrollY;
      const delta = y - lastY;
      if (Math.abs(delta) > 7) {
        const now = Date.now();
        if (now - lastDirectionChange > 35) {
          if (y < 90) setMemberDockHidden(false);
          else setMemberDockHidden(delta > 0);
          lastDirectionChange = now;
        }
        lastY = y;
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [currentUser?.id]);

  const navigateMemberDock = destination => {
    if (destination === "home") { setMemberDockTab("home"); setActiveScreen("home"); window.scrollTo({top:0,behavior:"smooth"}); }
    else if (destination === "music") { setMemberDockTab("music"); setActiveScreen("music"); setMobileMenu(false); window.scrollTo({top:0,behavior:"smooth"}); }
    else if (destination === "socials") { setMemberDockTab("socials"); setActiveScreen("social"); window.scrollTo({top:0,behavior:"smooth"}); }
    else if (destination === "create") { setModal("submit"); }
    else if (destination === "more") { setMemberDockTab("more"); setMobileMenu(true); window.scrollTo({top:0,behavior:"smooth"}); }
  };

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
    const form = event.currentTarget;
    setArtistStudioBusy(true);
    setArtistStudioError("");
    try {
      const formData = new FormData(form);
      const payload = { action };
      for (const [key, value] of formData.entries()) {
        if (!key.endsWith("File") && typeof value === "string") payload[key] = value.trim();
      }
      const token = await getAuthToken();
      if (!token) throw new Error("Your session has expired. Please log in again.");
      const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
      const uploadAsset = async (file, assetType) => {
        if (!(file instanceof File) || !file.size) return null;
        const signResponse = await fetch("/api/artist/studio", { method: "POST", headers, body: JSON.stringify({ action: "create_upload_url", assetType, contentType: file.type, size: file.size }) });
        const signed = await signResponse.json().catch(() => ({}));
        if (!signResponse.ok || !signed.ok) throw new Error(signed.error || "Could not prepare your secure file upload.");
        const uploadResponse = await fetch(signed.url, { method: signed.method || "PUT", headers: signed.headers || { "Content-Type": file.type }, body: file });
        if (!uploadResponse.ok) throw new Error("File upload failed. Please try again.");
        return signed.objectKey;
      };
      if (action === "add_track") {
        const file = formData.get("audioFile");
        if (!(file instanceof File) || !file.size) throw new Error("Choose an audio file to upload.");
        const audioObjectKey = await uploadAsset(file, "audio");
        let durationSeconds = Number(payload.durationSeconds) || null;
        if (!durationSeconds) {
          const audio = document.createElement("audio");
          const objectUrl = URL.createObjectURL(file);
          try {
            durationSeconds = await new Promise(resolve => {
              audio.preload = "metadata";
              audio.onloadedmetadata = () => resolve(Number.isFinite(audio.duration) ? Math.round(audio.duration) : null);
              audio.onerror = () => resolve(null);
              audio.src = objectUrl;
            });
          } finally { URL.revokeObjectURL(objectUrl); }
        }
        const trackPayload = { action: "add_track", releaseId: payload.releaseId, title: payload.title, durationSeconds, isrc: payload.isrc, audioObjectKey };
        const response = await fetch("/api/artist/studio", { method: "POST", headers, body: JSON.stringify(trackPayload) });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data.ok) throw new Error(data.error || "Your track could not be saved.");
      } else if (action === "create_release") {
        const coverArtObjectKey = await uploadAsset(formData.get("coverArtFile"), "artwork");
        const response = await fetch("/api/artist/studio", { method: "POST", headers, body: JSON.stringify({ ...payload, coverArtObjectKey }) });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data.ok) throw new Error(data.error || "Your release could not be saved.");
      } else if (action === "update_profile") {
        const avatarObjectKey = await uploadAsset(formData.get("avatarFile"), "avatar");
        const bannerObjectKey = await uploadAsset(formData.get("bannerFile"), "banner");
        const response = await fetch("/api/artist/studio", { method: "POST", headers, body: JSON.stringify({ ...payload, avatarObjectKey, bannerObjectKey }) });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data.ok) throw new Error(data.error || "Your profile could not be saved.");
      }
      const refreshed = await fetch("/api/artist/studio", { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
      const latest = await refreshed.json().catch(() => ({}));
      if (refreshed.ok && latest.ok) setArtistStudio(latest);
      notify(action === "create_release" ? "Release draft created." : action === "add_track" ? "Audio uploaded and track added to your release draft." : "Artist profile updated.");
      form.reset();
    } catch (error) { setArtistStudioError(error?.message || "Artist studio action failed."); }
    finally { setArtistStudioBusy(false); }
  };

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
    fetch("/api/promotions", { signal: controller.signal, cache: "no-store" })
      .then(response => response.ok ? response.json() : null)
      .then(data => { if (data?.ok && Array.isArray(data.campaigns) && !controller.signal.aborted) setPromotionCampaigns(data.campaigns); })
      .catch(error => { if (error?.name !== "AbortError") console.warn("Nochalant promotions unavailable:", error); });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!currentUser?.id) { setMyPromotionCampaigns([]); return; }
    let cancelled = false;
    (async () => {
      try {
        const token = await getAuthToken();
        if (!token) return;
        const response = await fetch("/api/promotions", { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + token }, body: JSON.stringify({ action: "my_campaigns" }), cache: "no-store" });
        const data = await response.json().catch(() => ({}));
        if (response.ok && data.ok && !cancelled) setMyPromotionCampaigns(data.campaigns || []);
      } catch (error) { if (!cancelled) console.warn("Your campaigns could not load:", error); }
    })();
    return () => { cancelled = true; };
  }, [currentUser?.id]);

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        const response = await fetch("/api/opinions", { signal: controller.signal, cache: "no-store" });
        const data = await response.json().catch(() => ({}));
        if (response.ok && data.ok && Array.isArray(data.opinions) && !controller.signal.aborted) setOpinions(data.opinions);
      } catch (error) {
        if (error?.name !== "AbortError") console.error("Nochalant public opinions could not load:", error);
      }
    })();
    return () => controller.abort();
  }, []);
  
  useEffect(() => { setOpinionSlide(0); }, [opinions.length]);
  const moveOpinion = (direction) => {
    if (!opinions.length) return;
    setOpinionSlide(index => (index + direction + opinions.length) % opinions.length);
  };

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/artists", { signal: controller.signal })
      .then(response => response.ok ? response.json() : null)
      .then(data => { if (data?.ok && Array.isArray(data.artists)) setArtists(data.artists); })
      .catch(error => { if (error?.name !== "AbortError") console.error("Nochalant artists could not load:", error); })
      .finally(() => { if (!controller.signal.aborted) setArtistsLoading(false); });
    return () => controller.abort();
  }, []);

  const openArtistProfile = async (slug) => {
    if (!slug) return;
    setArtistProfileLoading(true);
    setArtistProfileError("");
    setSelectedArtist(null);
    setModal("artist-profile");
    try {
      const response = await fetch("/api/artists?slug=" + encodeURIComponent(slug));
      const data = await response.json();
      if (!response.ok || !data?.ok || !data.artist) throw new Error(data?.error || "Artist profile could not be loaded.");
      setSelectedArtist(data.artist);
    } catch (error) {
      setArtistProfileError(error?.message || "Artist profile could not be loaded.");
    } finally {
      setArtistProfileLoading(false);
    }
  };

  const playArtistTrack = async (track, trackList = []) => {
    if (!track?.audio_url) {
      notify("This release is listed, but its playable audio file has not been connected yet.");
      return;
    }
    const queue = trackList.filter(item => item.audio_url);
    const index = Math.max(0, queue.findIndex(item => item.id === track.id));
    setAudioQueue(queue);
    setAudioQueueIndex(index);
    setActiveAudioTrack(track);
    setAudioPlayerVisible(true);
    const audio = audioRef.current;
    if (!audio) return;
    audio.src = track.audio_url;
    audio.load();
    try {
      setAudioError(false);
      await audio.play();
    } catch {
      setAudioPlaying(false);
      setAudioError(true);
      notify("This track could not start. Please try again.");
    }
  };

  const moveAudioQueue = async (direction) => {
    if (!audioQueue.length) return;
    const nextIndex = (audioQueueIndex + direction + audioQueue.length) % audioQueue.length;
    const nextTrack = audioQueue[nextIndex];
    setAudioQueueIndex(nextIndex);
    setActiveAudioTrack(nextTrack);
    const audio = audioRef.current;
    if (!audio || !nextTrack?.audio_url) return;
    audio.src = nextTrack.audio_url;
    audio.load();
    try {
      setAudioError(false);
      await audio.play();
    } catch {
      setAudioPlaying(false);
      setAudioError(true);
      notify("The next track could not start.");
    }
  };

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
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");
    const name = String(formData.get("name") || "").trim();
    const isSignup = modal === "signup";
    const accountType = isSignup ? String(formData.get("accountType") || "fan") : "";
    setAuthBusy(true);
    setAuthMessage("");
    try {
      const result = isSignup
        ? await authClient.signUp.email({ name, email, password })
        : await authClient.signIn.email({ email, password });
      if (result?.error) throw new Error(result.error.message || "Authentication failed.");

      const pendingKey = "nochalant_pending_account_type";
      if (isSignup) {
        window.localStorage.setItem(pendingKey, JSON.stringify({ email: email.toLowerCase(), accountType }));
      }
      const sessionResult = await authClient.getSession();
      const signedInUser = sessionResult?.data?.user || null;

      if (!signedInUser && isSignup) {
        setAuthMessage("Your account was created. Verify your email if requested, then sign in with this same email to finish setting up your selected account type.");
        return;
      }
      if (signedInUser) setCurrentUser(signedInUser);

      let pendingSelection = null;
      try {
        const stored = window.localStorage.getItem(pendingKey);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed?.email && parsed?.accountType) pendingSelection = parsed;
          else window.localStorage.removeItem(pendingKey);
        }
      } catch {
        window.localStorage.removeItem(pendingKey);
      }
      if (pendingSelection && pendingSelection.email !== email.toLowerCase()) {
        window.localStorage.removeItem(pendingKey);
        pendingSelection = null;
      }
      const pendingAccountType = isSignup ? accountType : pendingSelection?.accountType || "";
      let accountSetupNotice = "";
      if (pendingAccountType && signedInUser) {
        try {
          const token = await getAuthToken();
          if (!token) throw new Error("A secure session token was not available.");
          const profileResponse = await fetch("/api/account/type", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
            body: JSON.stringify({ accountType: pendingAccountType }),
            cache: "no-store"
          });
          const profileData = await profileResponse.json().catch(() => ({}));
          if (!profileResponse.ok || !profileData.ok) {
            if (profileResponse.status === 409) {
              window.localStorage.removeItem(pendingKey);
              accountSetupNotice = "You are signed in. Your existing account type is unchanged; account types cannot be switched after registration.";
            } else {
              throw new Error(profileData.error || "Your selected account type could not be activated.");
            }
          } else {
            window.localStorage.removeItem(pendingKey);
            setAccountProfileRefresh(value => value + 1);
          }
        } catch (profileError) {
          console.error("Nochalant account setup needs attention:", profileError?.message || profileError);
          accountSetupNotice = "You are signed in, but account setup is not complete yet. " + (profileError?.message || "Please retry account setup.");
        }
      }

      setAuthMessage(accountSetupNotice || (isSignup ? "Your account and selected account type are ready." : "You are signed in."));
      notify(isSignup ? "Welcome to Nochalant." : "Welcome back to Nochalant.");
      if (signedInUser) {
        setMemberDockTab("home");
        setMemberDockHidden(false);
        setAudioPlayerVisible(true);
        setActiveScreen("home");
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
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
      {controlRoomStatus === "authorized" && <><div className="control-room-welcome"><span className="eyebrow">PRIVATE · AUTHORIZED SESSION</span><h1>Control Room</h1><p>Signed in as {currentUser?.name || currentUser?.email || "authorized administrator"}.</p></div><DeferredPanel><OpinionsPanel open={true} mode="admin" onClose={() => { window.location.href = "/"; }} onNotice={notify} /></DeferredPanel><DeferredPanel><PodcastAdmin /></DeferredPanel><DeferredPanel><SocialSettingsAdmin /></DeferredPanel><section className="promotion-admin-panel"><div className="artists-heading"><div><span className="eyebrow">ADVERTISING REVIEW</span><h2>Promotion <em>queue.</em></h2><p>Only confirmed, paid campaigns can be approved.</p></div><button className="button button-outline" onClick={() => loadPromotionAdminQueue().catch(error => notify(error.message))}>Refresh queue</button></div>
        {promotionAdminQueue.length ? <div className="promotion-admin-list">{promotionAdminQueue.map(campaign => <article className="promotion-admin-row" key={campaign.id}>{campaign.media_url && (campaign.media_kind === "video" ? <video className="promotion-admin-preview" src={campaign.media_url} controls preload="metadata"/> : <img className="promotion-admin-preview" src={campaign.media_url} alt={campaign.title}/>)}<div><strong>{campaign.title}</strong><p>{campaign.package_code} · {campaign.media_kind} · {campaign.currency} {(Number(campaign.budget_minor||0)/100).toFixed(2)}</p><span className="dashboard-status">{campaign.status.replaceAll("_"," ")} · {campaign.payment_status}</span></div><div className="promotion-admin-actions"><button className="button button-green button-small" disabled={promotionAdminBusy || campaign.status!=="pending_review" || campaign.payment_status!=="paid"} onClick={() => moderatePromotion(campaign.id,"approve")}>Approve</button><button className="button button-outline button-small" disabled={promotionAdminBusy || campaign.status!=="pending_review" || campaign.payment_status!=="paid"} onClick={() => moderatePromotion(campaign.id,"reject")}>Reject</button></div></article>)}</div> : <div className="social-feed-state"><strong>No campaigns awaiting review.</strong><p>Paid campaigns will appear here after payment confirmation.</p></div>}
      </section></>}
    </main>
    {toast && <div className="toast" role="status">{toast}</div>}
  </div>;

  return <div className={"site-shell"+(appSkin === "light" ? " skin-light" : "")+(stickyHeaderEnabled ? "" : " header-not-sticky")}>
    <div className="ticker"><span className="ticker-label">NOCHALANT LIVE</span><div className="ticker-window"><div className="ticker-track"><span>NO DEY FORM, JUST PURE GIST</span><span>YOUR CULTURE. YOUR PEOPLE. YOUR BUZZ.</span><span>FREE DAILY SUBMISSIONS</span><span>WHAT'S HAPPENING? CHECK THE AGENDA</span><span>NO DEY FORM, JUST PURE GIST</span><span>YOUR CULTURE. YOUR PEOPLE. YOUR BUZZ.</span></div></div></div>
    <header className="site-header"><div className="nav-wrap">
      <a className="brand header-brand" href="#top">NOCHALANT<span>.</span></a>
      <button className="menu-toggle" aria-controls="nochalant-mobile-menu" aria-expanded={mobileMenu} onClick={() => setMobileMenu(!mobileMenu)} aria-label={mobileMenu ? "Close navigation" : "Open navigation"}>{mobileMenu ? "×" : "☰"}</button>
      {mobileMenu && <button className="drawer-backdrop" type="button" aria-label="Close navigation menu" onClick={() => setMobileMenu(false)} />}
      <nav id="nochalant-mobile-menu" className={mobileMenu ? "main-nav open" : "main-nav"} aria-label="Main navigation">
        {currentUser?.id && <section className="drawer-account" aria-label="Member account">
          <div className="drawer-member-identity">
            <span className="drawer-member-avatar">{accountProfile?.profileDetails?.avatar_url ? <img src={accountProfile.profileDetails.avatar_url} alt=""/> : (accountProfile?.profile?.display_name || currentUser?.name || currentUser?.email || "N").trim().charAt(0).toUpperCase()}</span>
            <span className="drawer-member-copy"><strong>{accountProfile?.profile?.display_name || currentUser?.name || "Nochalant member"}</strong><small>{accountProfile?.profileDetails?.username ? "@"+accountProfile.profileDetails.username : currentUser?.email || "Member account"}</small></span>
            <span className="drawer-account-type">{ACCOUNT_TYPE_LABELS[accountProfile?.profile?.account_type || "fan"] || "Fan / Listener"}</span>
          </div>
          <span className="drawer-kicker">YOUR ACCOUNT</span>
          <button type="button" className="drawer-account-link is-primary" onClick={() => {setMobileMenu(false);setActiveScreen("dashboard");window.scrollTo({top:0,behavior:"smooth"});}}>
            <span><strong>My dashboard</strong><small>Open your {({fan:"fan",artist:"artist",creator:"creator",event_organizer:"event organiser",business:"business",media:"publisher"})[accountProfile?.profile?.account_type || "fan"]} workspace</small></span>
            <span aria-hidden="true">→</span>
          </button>
          <button type="button" className="drawer-account-link" onClick={() => {setMobileMenu(false);setActiveScreen("dashboard");window.scrollTo({top:0,behavior:"smooth"});window.setTimeout(()=>document.getElementById("member-profile-settings")?.scrollIntoView({behavior:"smooth",block:"start"}),120);}}>Profile settings <span aria-hidden="true">→</span></button>
          <button type="button" className="drawer-account-link" onClick={() => {setMobileMenu(false);setActiveScreen("dashboard");window.scrollTo({top:0,behavior:"smooth"});window.setTimeout(()=>document.getElementById("account-dashboard-tools")?.scrollIntoView({behavior:"smooth",block:"start"}),120);}}>
            {({fan:"My activity & community",artist:"Artist studio & releases",creator:"Creator portfolio & bookings",event_organizer:"Events & guest management",business:"Brand profile & campaigns",media:"Publisher tools & submissions"})[accountProfile?.profile?.account_type || "fan"] || "My workspace"}
            <span aria-hidden="true">→</span>
          </button>
          <button type="button" className="drawer-account-logout" onClick={() => {setMobileMenu(false);signOutUser();}}>Log out</button>
        </section>}
        <div className="drawer-flagship"><span className="drawer-kicker">NOCHALANT FLAGSHIP</span>
          <button onClick={() => {setMobileMenu(false);setActiveScreen("home");window.scrollTo({top:0,behavior:"smooth"});}}>Home <span>01</span></button>
          <button onClick={() => {setMobileMenu(false);setActiveScreen("social");window.scrollTo({top:0,behavior:"smooth"});}}>Social <span>02</span></button>
          <a href="#artists" onClick={() => setMobileMenu(false)}>Discover <span>03</span></a>
          <button onClick={() => {setMobileMenu(false);setActiveScreen("promotions");window.scrollTo({top:0,behavior:"smooth"});}}>Promotions <span>04</span></button>
          <button onClick={() => {setMobileMenu(false);setActiveScreen("podcast");window.scrollTo({top:0,behavior:"smooth"});}}>Podcast <span>04</span></button>
          {currentUser?.id && accountProfile?.profile?.account_type === "artist" ? <button onClick={() => {setMobileMenu(false);setActiveScreen("dashboard");window.scrollTo({top:0,behavior:"smooth"});}}>Artist Studio <span>05</span></button> : <a href="#artists" onClick={() => setMobileMenu(false)}>Artists <span>05</span></a>}
          <a href="#agenda" onClick={() => setMobileMenu(false)}>Agenda <span>06</span></a>
          <a href="#agenda" onClick={() => setMobileMenu(false)}>Events <span>07</span></a>
          <a href="#artists" onClick={() => setMobileMenu(false)}>Bookings <span>08</span></a>
          <button onClick={() => {setMobileMenu(false);setModal("submit");}}>Submit <span>09</span></button>
        </div><div className="drawer-quick"><span className="drawer-kicker">QUICK ACCESS</span><a href="#latest" onClick={() => setMobileMenu(false)}>Latest gist</a><a href="#categories" onClick={() => setMobileMenu(false)}>Categories</a><a href="#hot-or-trash" onClick={() => setMobileMenu(false)}>Hot or Trash</a><button onClick={() => {setMobileMenu(false);if (!currentUser) setModal("login");else {setOpinionsPanelMode("dashboard");setOpinionsPanelOpen(true);}}}>My Opinions</button></div>
        <section className="drawer-preferences" aria-label="App preferences">
          <span className="drawer-kicker">YOUR APP EXPERIENCE</span>
          <div className="drawer-preference-row"><div><strong>App appearance</strong><small>Choose your Nochalant skin</small></div><div className="skin-switch" role="group" aria-label="App appearance"><button type="button" className={appSkin==="dark"?"active":""} onClick={()=>setAppSkin("dark")}>Dark</button><button type="button" className={appSkin==="light"?"active":""} onClick={()=>setAppSkin("light")}>Light</button></div></div>
          <label className="drawer-preference-toggle"><span><strong>Sticky header</strong><small>Keep navigation at the top</small></span><input type="checkbox" checked={stickyHeaderEnabled} onChange={e=>setStickyHeaderEnabled(e.target.checked)}/><i aria-hidden="true"/></label>
          <label className="drawer-preference-toggle"><span><strong>Bottom app dock</strong><small>Keep quick navigation at the bottom</small></span><input type="checkbox" checked={memberDockEnabled} onChange={e=>setMemberDockEnabled(e.target.checked)}/><i aria-hidden="true"/></label>
        </section>
      </nav>
      <div className="nav-actions">{currentUser && <button className="text-button nav-login" onClick={() => {setActiveScreen("dashboard");setMobileMenu(false);window.scrollTo({top:0,behavior:"smooth"});}}>My dashboard</button>}{currentUser ? <button className="text-button nav-login" onClick={signOutUser}>Log out</button> : <button className="text-button nav-login" onClick={() => setModal("login")}>Log in</button>}<button className="nav-spill" onClick={() => setModal("submit")}><span>Spill the tea</span></button>{!currentUser && <button className="nav-join" onClick={() => setModal("signup")}><span>Join Nochalant</span></button>}</div>
    </div></header>
    

    <main id="top">
      {activeScreen === "music" ? (() => {
        const allMusicTracks = artists.flatMap(artist => (artist.tracks || []).map(track => ({
          ...track,
          artist_name: track.artist_name || artist.name,
          artist_slug: track.artist_slug || artist.slug,
          genre: track.genre || artist.genre || "Other"
        })));
        const searchableTracks = allMusicTracks.filter(track => {
          const query = musicSearch.trim().toLowerCase();
          const matchesSearch = !query || [track.title, track.artist_name, track.genre].some(value => String(value || "").toLowerCase().includes(query));
          const matchesGenre = musicGenre === "All genres" || String(track.genre || "").toLowerCase() === musicGenre.toLowerCase();
          return matchesSearch && matchesGenre;
        });
        const rankedTracks = [...searchableTracks].sort((a,b) => Number(b.plays_count || 0) - Number(a.plays_count || 0));
        const genres = ["All genres", ...Array.from(new Set(allMusicTracks.map(track => String(track.genre || "").trim()).filter(Boolean))).sort((a,b)=>a.localeCompare(b))];
        const playTrack = track => playArtistTrack(track, allMusicTracks);
        const trackCard = (track, index) => <article className="music-release-card" key={track.id}>
          <button className="music-release-art" type="button" onClick={() => playTrack(track)} disabled={!track.audio_url} aria-label={"Play " + track.title}>
            {track.cover_art_url ? <img src={track.cover_art_url} alt={track.title + " cover art"} loading="lazy"/> : <span>♫</span>}
            <i>▶</i>
          </button>
          <div className="music-release-meta"><b>{String(index + 1).padStart(2,"0")}</b><span>{track.genre || "No genre"}</span></div>
          <strong>{track.title}</strong>
          <button className="music-artist-link" type="button" onClick={() => openArtistProfile(track.artist_slug)}>{track.artist_name}{track.is_verified && <span className="artist-silver-tick">✓</span>}</button>
          <div className="music-release-foot"><span>{Number(track.plays_count || 0).toLocaleString()} plays</span><button type="button" onClick={() => playTrack(track)} disabled={!track.audio_url}>{track.audio_url ? "PLAY" : "COMING SOON"}</button></div>
        </article>;
        return <section className="music-hub container screen-page" aria-labelledby="music-hub-title">
          <header className="music-hub-hero">
            <div><span className="eyebrow">NOCHALANT MUSIC · THE SOUND OF THE CULTURE</span><h1 id="music-hub-title">Your sound.<br/><em>Your culture.</em></h1><p>Discover official releases from artists on Nochalant, explore genres and find your next repeat.</p></div>
            <div className="music-hub-mark" aria-hidden="true">♫</div>
          </header>
          <div className="music-hub-tabs" role="tablist" aria-label="Music sections">
            {[["discover","Discover"],["top100","Nochalant Top 100"],["genres","Genres"],["playlists","Playlists"],["artists","Artists"],["library","My library"]].map(([id,label])=><button type="button" role="tab" aria-selected={musicTab===id} className={musicTab===id?"active":""} onClick={()=>setMusicTab(id)} key={id}>{label}</button>)}
          </div>
          <label className="music-hub-search"><span>⌕</span><input value={musicSearch} onChange={event=>setMusicSearch(event.target.value)} placeholder="Search songs, artists or genres" aria-label="Search music"/></label>
          {musicTab === "discover" && <>
            <section className="music-hub-section"><div className="music-hub-section-heading"><div><span className="eyebrow">FRESH RELEASES</span><h2>New on <em>Nochalant.</em></h2><p>Official tracks published by Nochalant artists.</p></div><span>{allMusicTracks.length} RELEASES</span></div>
              {artistsLoading ? <div className="music-hub-empty">Loading the artist catalogue…</div> : searchableTracks.length ? <div className="music-release-grid">{searchableTracks.slice(0,12).map(trackCard)}</div> : <div className="music-hub-empty">No matching published releases yet. Verified artist releases will appear here when approved and published.</div>}
            </section>
            <section className="music-hub-section"><div className="music-hub-section-heading"><div><span className="eyebrow">FIND YOUR SOUND</span><h2>Explore <em>genres.</em></h2></div></div><div className="music-genre-grid">{genres.slice(1).map(genre=><button type="button" key={genre} onClick={()=>{setMusicGenre(genre);setMusicTab("genres");}}>{genre}<span>Explore →</span></button>)}{genres.length===1&&<p className="music-hub-empty">Genre shelves will appear as artists publish releases with genre information.</p>}</div></section>
          </>}
          {musicTab === "top100" && <section className="music-hub-section"><div className="music-hub-section-heading"><div><span className="eyebrow">THE NOCHALANT CHART</span><h2>Nochalant <em>Top 100.</em></h2><p>Ranked by eligible plays recorded on Nochalant. Rankings update as verified plays are counted.</p></div><span>LIVE CATALOGUE DATA</span></div>
            {rankedTracks.length ? <div className="music-chart-list">{rankedTracks.slice(0,100).map((track,index)=><div className="music-chart-row" key={track.id}><b className="music-chart-rank">{String(index+1).padStart(2,"0")}</b>{track.cover_art_url?<img src={track.cover_art_url} alt="" loading="lazy"/>:<span className="music-chart-placeholder">♫</span>}<div><strong>{track.title}</strong><small>{track.artist_name} · {track.genre || "Genre not set"}</small></div><span className="music-chart-plays">{Number(track.plays_count||0).toLocaleString()} plays</span><button type="button" onClick={()=>playTrack(track)} disabled={!track.audio_url} aria-label={"Play "+track.title}>▶</button></div>)}</div>:<div className="music-hub-empty">{artistsLoading?"Loading chart data…":"The chart will populate when approved releases have eligible play counts. No rankings are being fabricated."}</div>}
          </section>}
          {musicTab === "genres" && <section className="music-hub-section"><div className="music-hub-section-heading"><div><span className="eyebrow">EXPLORE BY SOUND</span><h2>Music <em>genres.</em></h2><p>Browse published releases by the genre selected by each artist.</p></div></div><div className="music-genre-pills">{genres.map(genre=><button type="button" className={musicGenre===genre?"active":""} key={genre} onClick={()=>setMusicGenre(genre)}>{genre}</button>)}</div>{searchableTracks.length?<div className="music-release-grid">{searchableTracks.map(trackCard)}</div>:<div className="music-hub-empty">No releases are listed in this genre yet.</div>}</section>}
          {musicTab === "playlists" && <section className="music-hub-section"><div className="music-hub-section-heading"><div><span className="eyebrow">CURATED FOR THE CULTURE</span><h2>Playlists <em>& moods.</em></h2><p>Editorial playlists will bring together official Nochalant releases by genre, mood and moment.</p></div></div><div className="music-playlist-grid"><article><span>01</span><b>Afrobeats Essentials</b><small>Curated Afrobeats releases</small></article><article><span>02</span><b>Naija Street & Energy</b><small>Street-pop and high-energy sounds</small></article><article><span>03</span><b>Late Night R&amp;B</b><small>Soul, R&amp;B and slow jams</small></article><article><span>04</span><b>New & Next</b><small>Fresh discoveries from the culture</small></article></div><div className="music-hub-empty">Playlist playback is not live yet. These are editorial playlist destinations, not populated playlists; tracks will appear when the playlist catalogue is connected.</div></section>}
          {musicTab === "artists" && <section className="music-hub-section"><div className="music-hub-section-heading"><div><span className="eyebrow">THE PEOPLE BEHIND THE SOUND</span><h2>Artists on <em>Nochalant.</em></h2></div><span>{artists.length} ARTISTS</span></div>{artists.length?<div className="music-artist-grid">{artists.map(artist=><button type="button" className="music-artist-card" key={artist.id || artist.slug} onClick={()=>openArtistProfile(artist.slug)}>{artist.image_url?<img src={artist.image_url} alt="" loading="lazy"/>:<span className="music-artist-placeholder">{String(artist.name||"N").slice(0,1)}</span>}<b>{artist.name}</b><small>{artist.genre || "Artist"}</small></button>)}</div>:<div className="music-hub-empty">{artistsLoading?"Loading artists…":"No artist profiles are published yet."}</div>}</section>}
          {musicTab === "library" && <section className="music-hub-section"><div className="music-hub-section-heading"><div><span className="eyebrow">YOUR PERSONAL COLLECTION</span><h2>My <em>library.</em></h2></div></div><div className="music-hub-empty">Your saved songs, liked releases and followed artists will appear here when Music Library saving is enabled.</div></section>}
        </section>;
      })() : activeScreen === "home" ? <>
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

      {currentUser?.id && <section className="container home-community-timeline" aria-label="Your Nochalant timeline">
        <div className="section-heading"><div><span className="eyebrow">THE CULTURE · THE COMMUNITY</span><h2>Your <em>timeline.</em></h2><p>Public posts and conversations from fans, artists, creators, businesses, media and event organisers.</p></div></div>
        <DeferredPanel><SocialFeed currentUser={currentUser} onJoin={() => {setAuthMessage("");setModal("signup");}} onLogin={() => {setAuthMessage("");setModal("login");}} onShare={() => {if (!currentUser) setModal("login"); else {setOpinionsPanelMode("dashboard");setOpinionsPanelOpen(true);}}}/></DeferredPanel>
      </section>}

      <section className="artists-section container" id="artists" aria-labelledby="artists-title">
        <div className="artists-heading">
          <div><span className="eyebrow">THE SOUND OF THE CULTURE</span><h2 id="artists-title">Artists on <em>Nochalant.</em></h2><p>Released music, original cover art and the artists moving the culture.</p></div>
          <div className="artists-controls" aria-label="Artist carousel controls">
            <button type="button" onClick={() => moveArtistRail(-1)} aria-label="Previous releases" disabled={!artists.some(artist => artist.tracks?.length)}><span aria-hidden="true">←</span></button>
            <button type="button" onClick={() => moveArtistRail(1)} aria-label="Next releases" disabled={!artists.some(artist => artist.tracks?.length)}><span aria-hidden="true">→</span></button>
          </div>
        </div>
        <div className="artists-viewport" ref={artistRailRef} aria-label="Nochalant releases. Swipe or use the arrow controls to browse." tabIndex="0" onMouseEnter={() => setArtistRailPaused(true)} onMouseLeave={() => setArtistRailPaused(false)} onFocus={() => setArtistRailPaused(true)} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setArtistRailPaused(false); }} onTouchStart={() => setArtistRailPaused(true)} onTouchEnd={() => setArtistRailPaused(false)}>
          {artists.some(artist => artist.tracks?.length) ? <div className="artists-track">{artists.flatMap(artist => artist.tracks || []).map(track => {
            const playableTracks = artists.flatMap(item => item.tracks || []);
            return <article className="artist-card artist-track-card" key={track.id}>
              <button type="button" className="artist-avatar artist-track-art" onClick={() => openArtistProfile(track.artist_slug)} aria-label={"View " + track.artist_name + "'s artist profile"}>
                {track.cover_art_url ? <img src={track.cover_art_url} alt={track.title + " cover art"} loading="lazy" /> : <span>{track.artist_name?.slice(0,1).toUpperCase() || "N"}</span>}
                <span className="artist-track-play" aria-hidden="true">▶</span>
              </button>
              <button type="button" className="artist-name artist-track-title" onClick={() => openArtistProfile(track.artist_slug)}>{track.title}</button>
              <button type="button" className="artist-track-artist" onClick={() => openArtistProfile(track.artist_slug)}>{track.artist_name}{track.is_verified && <span className="artist-silver-tick" title="Nochalant verified artist" aria-label="Nochalant verified artist">✓</span>}</button>
              <div className="artist-track-stats">
                <span title="Eligible plays"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 2.5v11l9-5.5z"/></svg>{Number(track.plays_count || 0).toLocaleString()}</span>
                {track.audio_url ? <a href={"/api/music/download?trackId=" + encodeURIComponent(track.id)} title="Download track" aria-label={"Download " + track.title}><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1.5v8m0 0 3-3m-3 3-3-3M2.5 11v2.5h11V11"/></svg>{Number(track.download_count || 0).toLocaleString()}</a> : <span title="Downloads"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1.5v8m0 0 3-3m-3 3-3-3M2.5 11v2.5h11V11"/></svg>{Number(track.download_count || 0).toLocaleString()}</span>}
              </div>
              <button type="button" className="artist-track-listen" onClick={() => playArtistTrack(track, playableTracks)} disabled={!track.audio_url}>{track.audio_url ? "PLAY TRACK" : "AUDIO COMING SOON"}</button>
            </article>;
          })}</div> : <div className="artists-empty">{artistsLoading ? "Loading verified artist releases…" : "No artist releases have been published yet. Verified artist releases will appear here with their original cover art."}</div>}
        </div>
      </section>

      <section className="section container" id="latest"><div className="section-heading"><div><div className="eyebrow">FRESH FROM THE CULTURE</div><h2>Latest <em>crispy gist.</em></h2></div><span className="demo-label">SAMPLE CONTENT · NOT LIVE NEWS</span></div>
        <div className="filter-row" id="categories"><div className="category-tabs">{categories.map(item => <button key={item} className={category === item ? "category-tab active" : "category-tab"} onClick={() => setCategory(item)}>{item}</button>)}</div><label className="search-box"><span aria-hidden="true">⌕</span><input aria-label="Search stories" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search the gist"/></label></div>
        <div className="story-grid">{filtered.map(item => <article className="story-card" key={item.id} role="button" tabIndex="0" aria-label={`Open story: ${item.title}`} onClick={() => openStory(item)} onKeyDown={e => e.key === "Enter" && e.target === e.currentTarget && openStory(item)}><div className="story-image"><img src={item.image} alt=""/></div><div className="story-content"><div className="story-meta"><span>{item.time}</span><span>{item.read}</span></div><h3>{item.title}</h3><div className="story-byline"><span>By {item.author}</span><span>{typeof viewCounts[item.id] === "number" ? `${viewCounts[item.id].toLocaleString()} views` : "Views loading"}</span></div><div className="story-card-bottom"><span className="story-category-quiet">{item.category}</span><div className="story-foot"><button className={likes[item.id] ? "like-action liked" : "like-action"} onClick={e => {e.stopPropagation();toggleLike(item.id);}} aria-pressed={!!likes[item.id]} aria-label={likes[item.id] ? "Unlike story" : "Like story"}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.8 8.8c0 5.2-8.8 11-8.8 11S3.2 14 3.2 8.8A4.8 4.8 0 0 1 12 6.1a4.8 4.8 0 0 1 8.8 2.7Z"/></svg></button><span className="story-icon-stat" aria-label={`${comments[item.id]?.length || 0} comments`}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11.5a7.5 7.5 0 0 1-8 7.5 8.8 8.8 0 0 1-3.7-.8L4 20l1.3-3.4A7.1 7.1 0 0 1 4 12c0-4.1 3.6-7.5 8-7.5s8 3.1 8 7Z"/></svg><small>{comments[item.id]?.length || 0}</small></span><span className="story-icon-stat" aria-label={`${typeof viewCounts[item.id] === "number" ? viewCounts[item.id] : 0} views`}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 12s3.4-6 9.5-6 9.5 6 9.5 6-3.4 6-9.5 6-9.5-6-9.5-6Z"/><circle cx="12" cy="12" r="2.5"/></svg><small>{typeof viewCounts[item.id] === "number" ? viewCounts[item.id] : 0}</small></span><button className="story-icon-button" type="button" aria-label="Share story" onClick={e => {e.stopPropagation(); if(navigator.share) navigator.share({title:item.title,url:window.location.href}).catch(()=>{}); else if(navigator.clipboard) navigator.clipboard.writeText(window.location.href);}}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15V3m0 0L7.5 7.5M12 3l4.5 4.5M5 13v7h14v-7"/></svg></button></div></div></div></article>)}{filtered.length === 0 && <div className="empty-state">No stories in this category yet. Check back soon.</div>}</div><div className="story-more-wrap"><button type="button" className="story-more-link" onClick={() => {setCategory("All Gist");document.getElementById("latest")?.scrollIntoView({behavior:"smooth",block:"start"});}}>MORE <span aria-hidden="true">››</span></button></div>
      </section>

      <section className="section container jury-section" id="hot-or-trash">
        <div className="jury-panel jury-opinion-card">
          <div className="jury-copy">
            <div className="eyebrow">NO BE EVERY TREND WE GO FOLLOW</div>
            <h2>Hot or <em>trash?</em></h2>
            <p>Everybody get opinion. Is this look, sound or trend giving what it should give? Cast your vote.</p>
          </div>
          <div className="jury-opinion-avatar" aria-hidden="true">
            <img src={opinions[opinionSlide]?.avatar_url || "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=700&q=85"} alt="" />
          </div>
          <div className="jury-options">
            <button className={vote === "hot" ? "jury-option hot selected" : "jury-option hot"} onClick={() => castVote("hot")} disabled={voteBusy || !!vote || pollLoading || !poll}>🔥 Pure fire</button>
            <button className={vote === "trash" ? "jury-option trash selected" : "jury-option trash"} onClick={() => castVote("trash")} disabled={voteBusy || !!vote || pollLoading || !poll}>✕ Off key</button>
          </div>
          <div className="jury-slider-controls">
            <button className="jury-slider-nav" type="button" onClick={() => moveOpinion(-1)} disabled={opinions.length < 2} aria-label="Previous opinion">‹ <span>PREVIOUS</span></button>
            <div className="jury-pagination" aria-label="Choose community opinion">
              {opinions.map((item, index) => <button key={item.id} type="button" aria-label={`Show opinion ${index + 1}`} aria-current={index === opinionSlide ? "true" : undefined} className={index === opinionSlide ? "active" : ""} onClick={() => setOpinionSlide(index)} />)}
            </div>
            <button className="jury-slider-nav" type="button" onClick={() => moveOpinion(1)} disabled={opinions.length < 2} aria-label="Next opinion"><span>NEXT</span> ›</button>
          </div>
          <small className="muted jury-feedback">{pollError || (pollLoading ? "Loading community results…" : (vote ? "Your vote has been recorded. Thanks for having your say." : (currentUser ? "One vote per account. Your choice is saved securely." : "Log in to vote. Community results update as votes are counted.")))}</small>
        </div>
      </section>

      <section className="agenda-section" id="agenda"><div className="container"><div className="section-heading"><div><div className="eyebrow">THE CITY NEVER SLEEPS</div><h2>What's on the <em>Agenda?</em></h2></div><span className="agenda-note">EVENTS · HANGOUTS · EXPERIENCES</span></div>
        <div className="nochalant-faces">
          <div className="faces-heading"><div className="faces-title"><span className="faces-brand-mark" aria-hidden="true"><span></span></span><h3>Nochalant Faces</h3></div></div>
          <div className="faces-viewport" aria-label="Nochalant community profiles">
            <div className="faces-track">{[...communityFaces, ...communityFaces].map((face, index) => <button className="face-item" key={face.username + "-" + index} type="button" aria-label={face.display_name + " demo profile"} title={face.display_name}><span className={"face-avatar tone-" + (face.tone || "lime")}><span>{face.initials || face.display_name.slice(0,2).toUpperCase()}</span></span><span className="face-name">{face.display_name}</span></button>)}</div>
          </div>
          
        </div>
        <div className="agenda-empty"><h3>Your next link-up belongs here.</h3><p>Upcoming events will appear after they are submitted and approved by the Nochalant team.</p><button className="button button-outline" onClick={() => {setFormCategory("Agenda");setModal("submit");}}>Submit an event</button></div></div></section>

      <section className="promo-section container"><div className="promo-copy"><div className="eyebrow">GOT SOMETHING TO SAY?</div><h2>Don't just watch<br/>the buzz. <em>Be the buzz.</em></h2><p>Got a new song, event, club night, brand, talent or lifestyle story? Send it to Nochalant. Free daily submissions are welcome.</p><button className="button button-green" onClick={() => setModal("submit")}>Spill your gist</button></div><div className="pricing-card"><div className="pricing-top"><span className="pill pill-gold">PROMOTIONS</span></div><h3>Put your brand in the <em>spotlight.</em></h3><p>Promote videos, images, products, events and campaigns with a dedicated Nochalant placement.</p><div className="price">From ₦2,000 <small>/ campaign</small></div><ul><li>Image and video packages</li><li>7, 14 and 30-day campaigns</li><li>Payment and admin review before publishing</li></ul><button className="button button-dark" onClick={() => {setActiveScreen("promotions");window.scrollTo({top:0,behavior:"smooth"});}}>Explore promotions</button></div></section>
      </> : activeScreen === "promotions" ? <section className="promotions-page container screen-page">
        <div className="promotions-hero"><span className="eyebrow">NOCHALANT FOR BRANDS</span><h1>Make some <em>noise.</em></h1><p>Promote your brand, event, product, video or creative work to the Nochalant audience.</p></div>
        {!promotionPackageChosen && <div className="promotion-package-grid">
          <article className="promotion-package"><span className="eyebrow">IMAGE · 7 DAYS</span><h2>₦2,000 <small>/ $1.99</small></h2><p>One promotional image or flyer with caption and destination link.</p><button className="button button-outline" onClick={() => {setPromotionPackage("image_7d");setPromotionKind("image");setPromotionPackageChosen(true);document.getElementById("promotion-submit")?.scrollIntoView({behavior:"smooth"});}}>Choose image</button></article>
          <article className="promotion-package"><span className="eyebrow">VIDEO · 7 DAYS</span><h2>₦4,000 <small>/ $3.99</small></h2><p>One promotional video with caption and destination link.</p><button className="button button-outline" onClick={() => {setPromotionPackage("video_7d");setPromotionKind("video");setPromotionPackageChosen(true);document.getElementById("promotion-submit")?.scrollIntoView({behavior:"smooth"});}}>Choose video</button></article>
          <article className="promotion-package promotion-package-featured"><span className="eyebrow">PREMIUM · 14 DAYS</span><h2>₦8,000 <small>/ $7.99</small></h2><p>Premium image, video or designed text placement with a clickable call-to-action.</p><button className="button button-green" onClick={() => {setPromotionPackage("premium_14d");setPromotionKind("text");setPromotionPackageChosen(true);document.getElementById("promotion-submit")?.scrollIntoView({behavior:"smooth"});}}>Create text promotion</button></article>
          <article className="promotion-package"><span className="eyebrow">EXTENDED · 30 DAYS</span><h2>₦15,000 <small>/ $14.99</small></h2><p>Longer premium campaign for brands, launches and events.</p><button className="button button-outline" onClick={() => {setPromotionPackage("extended_30d");setPromotionPackageChosen(true);document.getElementById("promotion-submit")?.scrollIntoView({behavior:"smooth"});}}>Choose extended</button></article>
        </div>}
        <form id="promotion-submit" className="promotion-submit-form" onSubmit={async event => {
          event.preventDefault(); if (!currentUser) { setModal("login"); return; }
          const form = event.currentTarget; const data = new FormData(form); const file = data.get("mediaFile");
          const isText = promotionKind === "text";
          if (isText && textPromotionBody.trim().length < 12) { setPromotionMessage("Write at least 12 characters for your text promotion."); return; }
          if (!isText && (!(file instanceof File) || !file.size)) { setPromotionMessage("Please select an image or video."); return; }
          setPromotionBusy(true); setPromotionMessage("");
          try {
            const token = await getAuthToken(); if (!token) throw new Error("Please sign in again.");
            const headers = {"Content-Type":"application/json",Authorization:"Bearer "+token};
            let objectKey = null;
            if (!isText) {
              const signedResponse = await fetch("/api/promotions",{method:"POST",headers,body:JSON.stringify({action:"create_upload_url",kind:promotionKind,contentType:file.type,size:file.size})});
              const signed = await signedResponse.json(); if (!signedResponse.ok || !signed.ok) throw new Error(signed.error || "Could not prepare upload.");
              const upload = await fetch(signed.url,{method:signed.method || "PUT",headers:signed.headers || {"Content-Type":file.type},body:file});
              if (!upload.ok) throw new Error("Media upload failed.");
              objectKey = signed.objectKey;
            }
            const createResponse = await fetch("/api/promotions",{method:"POST",headers,body:JSON.stringify({action:"create_campaign",title:data.get("title"),description:data.get("description"),packageCode:promotionPackage,kind:promotionKind,mediaObjectKey:objectKey,textBody:textPromotionBody,designConfig:textPromotionDesign,destinationUrl:data.get("destinationUrl"),contactText:data.get("contactText"),currency:data.get("currency")})});
            const created = await createResponse.json(); if (!createResponse.ok || !created.ok) throw new Error(created.error || "Campaign could not be saved.");
            form.reset(); setTextPromotionBody(""); setTextPromotionDesign({theme:"midnight",layout:"editorial",alignment:"left",icon:"spark",font:"modern"});
            if (created.campaign?.id) {
              setMyPromotionCampaigns(current => [created.campaign, ...current.filter(item => item.id !== created.campaign.id)]);
              await startPromotionCheckout(created.campaign.id);
            } else setPromotionMessage(created.message || "Campaign saved. Payment and review are still required.");
          } catch(error) { setPromotionMessage(error.message || "Campaign could not be submitted."); }
          finally { setPromotionBusy(false); }
        }}>
          <span className="eyebrow">START A CAMPAIGN</span><h2 id="promotion-submit">Submit your promotion.</h2>{promotionPackageChosen && <p className="fine-print">Package selected. Pricing is hidden while you complete your promotion. <button type="button" className="text-button" onClick={()=>setPromotionPackageChosen(false)}>Change package</button></p>}
          <div className="promotion-form-grid"><label>Campaign title<input name="title" required maxLength="120" placeholder="Your brand, event or product"/></label>
          <label>Package<select value={promotionPackage} onChange={event => setPromotionPackage(event.target.value)}>{promotionKind!=="text"&&<><option value="image_7d">Image · 7 days</option><option value="video_7d">Video · 7 days</option></>}<option value="premium_14d">Premium · 14 days</option><option value="extended_30d">Extended · 30 days</option></select></label>
          <label>Promotion format<select value={promotionKind} onChange={event => {const next=event.target.value;setPromotionKind(next);if(next==="text"&&["image_7d","video_7d"].includes(promotionPackage))setPromotionPackage("premium_14d");}}><option value="image">Image</option><option value="video">Video</option><option value="text">Designed text</option></select></label>
          <label>Currency<select name="currency"><option value="NGN">NGN · Nigeria</option><option value="USD">USD · International</option></select></label>
          {promotionKind === "text" ? <div className="text-promo-studio">
            <div className="text-promo-studio-heading"><span className="eyebrow">NOCHALANT TEXT STUDIO</span><h3>Design your message.</h3><p>Choose a restrained style. Your preview updates as you customise it.</p></div>
            <label className="text-promo-copy-label">Promotion message<textarea value={textPromotionBody} onChange={event=>setTextPromotionBody(event.target.value.slice(0,700))} rows="4" maxLength="700" placeholder="Write a clear, memorable message for the Nochalant audience."/></label>
            <div className="text-promo-controls">
              <label>Layout<select value={textPromotionDesign.layout} onChange={event=>setTextPromotionDesign(d=>({...d,layout:event.target.value}))}><option value="editorial">Editorial</option><option value="poster">Poster</option><option value="minimal">Minimal</option></select></label>
              <label>Theme<select value={textPromotionDesign.theme} onChange={event=>setTextPromotionDesign(d=>({...d,theme:event.target.value}))}><option value="midnight">Midnight</option><option value="lime">Nochalant lime</option><option value="cream">Warm cream</option><option value="ember">Ember</option></select></label>
              <label>Typography<select value={textPromotionDesign.font} onChange={event=>setTextPromotionDesign(d=>({...d,font:event.target.value}))}><option value="modern">Modern</option><option value="serif">Editorial serif</option><option value="mono">Mono</option></select></label>
              <label>Alignment<select value={textPromotionDesign.alignment} onChange={event=>setTextPromotionDesign(d=>({...d,alignment:event.target.value}))}><option value="left">Left</option><option value="center">Centered</option></select></label>
              <label>Accent icon<select value={textPromotionDesign.icon} onChange={event=>setTextPromotionDesign(d=>({...d,icon:event.target.value}))}><option value="none">No icon</option><option value="spark">✦ Spark</option><option value="star">★ Star</option><option value="bolt">↯ Bolt</option><option value="heart">♥ Heart</option><option value="music">♫ Music</option><option value="megaphone">◉ Spotlight</option></select></label>
            </div>
            <div className={"text-promo-preview theme-"+textPromotionDesign.theme+" layout-"+textPromotionDesign.layout+" align-"+textPromotionDesign.alignment+" font-"+textPromotionDesign.font}>
              <span className="text-promo-preview-brand">NOCHALANT <i>FOR BRANDS</i></span>
              {textPromotionDesign.icon!=="none"&&<span className="text-promo-preview-icon">{({spark:"✦",star:"★",bolt:"↯",heart:"♥",music:"♫",megaphone:"◉"})[textPromotionDesign.icon]}</span>}
              <strong>{textPromotionBody.trim()||"Your message, styled to stand out."}</strong>
              <span className="text-promo-preview-footer">FEATURED MESSAGE · NOCHALANT</span>
            </div>
            <small className="fine-print">Preview only. Text is reviewed before publishing. Keep copy clear and avoid excessive symbols.</small>
          </div> : <label className="promotion-file-label">Upload {promotionKind}<input name="mediaFile" type="file" required accept={promotionKind==="image"?"image/jpeg,image/png,image/webp,image/avif":"video/mp4,video/webm,video/quicktime"}/><small>Images up to 15 MB · Videos up to 200 MB</small></label>}
          <label>Destination link<input name="destinationUrl" type="url" placeholder="https://..."/></label>
          <label className="promotion-description-label">Description<textarea name="description" rows="3" maxLength="1200" placeholder="Tell people what you're promoting"/></label>
          <label>Contact details<input name="contactText" maxLength="120" placeholder="Optional phone or social handle"/></label></div>
          {promotionMessage && <p className="promotion-message" role="status">{promotionMessage}</p>}
          <button className="button button-green" type="submit" disabled={promotionBusy}>{promotionBusy?"Submitting…":"Submit promotion"}</button>
          <small className="fine-print">Your campaign is saved as pending payment. It will not appear publicly until payment is confirmed and Nochalant approves it.</small>
        </form>
        {currentUser && <section className="my-promotion-campaigns"><div className="artists-heading"><div><span className="eyebrow">ADVERTISER DASHBOARD</span><h2>Your <em>campaigns.</em></h2><p>Check payment, moderation and campaign performance.</p></div></div>
          {myPromotionCampaigns.length ? <div className="my-promotion-list">{myPromotionCampaigns.map(campaign => <article className="my-promotion-row" key={campaign.id}><div><strong>{campaign.title}</strong><p>{campaign.package_code?.replaceAll("_"," ")} · {campaign.currency} {(Number(campaign.budget_minor||0)/100).toFixed(2)}</p></div><div className="my-promotion-status"><span>{campaign.payment_status}</span><span>{campaign.status.replaceAll("_"," ")}</span>{["unpaid","failed"].includes(campaign.payment_status) && campaign.status==="pending_payment" && <button className="button button-outline button-small" disabled={promotionBusy} onClick={() => startPromotionCheckout(campaign.id)}>Pay now</button>}</div><div className="my-promotion-metrics"><span>{Number(campaign.impressions_count||0).toLocaleString()} impressions</span><span>{Number(campaign.clicks_count||0).toLocaleString()} clicks</span></div></article>)}</div> : <div className="social-feed-state"><strong>No campaigns yet.</strong><p>Your submitted campaigns will appear here.</p></div>}
        </section>}
        <section className="promotion-live-list"><div className="artists-heading"><div><span className="eyebrow">BRANDS · EVENTS · CREATORS</span><h2>In the <em>spotlight.</em></h2><p>Approved promotions from the Nochalant community.</p></div></div>
          {promotionCampaigns.length ? <div className="promotion-live-grid">{promotionCampaigns.map(campaign => <article className="promotion-live-card" key={campaign.id}>
            {campaign.media_kind === "text" ? <div className={`promotion-text-live theme-${campaign.design_config?.theme||"midnight"} layout-${campaign.design_config?.layout||"editorial"} align-${campaign.design_config?.alignment||"left"} font-${campaign.design_config?.font||"modern"}`}><span>NOCHALANT · SPONSORED</span><strong>{campaign.description}</strong></div> : campaign.media_kind === "video" ? <video src={campaign.media_url} controls playsInline preload="metadata" /> : <img src={campaign.media_url} alt={campaign.title}/>}
            <div><span className="pill pill-gold">SPONSORED</span><h3>{campaign.title}</h3>{campaign.media_kind!=="text"&&<p>{campaign.description}</p>}{campaign.destination_url && <a href={campaign.destination_url} target="_blank" rel="noreferrer">Learn more ↗</a>}</div>
          </article>)}</div> : <div className="social-feed-state"><strong>Be the first in the spotlight.</strong><p>Approved campaigns will appear here.</p></div>}
        </section>
      </section> : activeScreen === "social" ? <section className="social-section container screen-page" id="social" aria-labelledby="social-title"><DeferredPanel><SocialFeed currentUser={currentUser} onJoin={() => { setAuthMessage(""); setModal("signup"); }} onLogin={() => { setAuthMessage(""); setModal("login"); }} onShare={() => { if (!currentUser) setModal("login"); else { setOpinionsPanelMode("dashboard"); setOpinionsPanelOpen(true); } }} /></DeferredPanel></section> : activeScreen === "podcast" ? <section className="podcast-section container screen-page" id="podcast-show" aria-labelledby="podcast-show-title">
        <div className="podcast-heading"><div><span className="eyebrow">ORIGINALS · NOCHALANT STUDIOS</span><h1 id="podcast-show-title">Nochalant <em>Podcast.</em></h1><p>Watch the conversations, performances and stories moving Nigerian culture.</p></div>{podcastDisplayItems[selectedPodcastIndex]?.id && podcastCatalogue.shows.find(show=>show.id===podcastDisplayItems[selectedPodcastIndex].id)?.host_name ? (()=>{const host=podcastCatalogue.shows.find(show=>show.id===podcastDisplayItems[selectedPodcastIndex].id);return <aside className="podcast-host-card">{host.host_image_url?<img src={host.host_image_url} alt={host.host_name} loading="lazy"/>:<span className="podcast-host-avatar">N.</span>}<div><span className="eyebrow">YOUR HOST</span><button type="button" className="podcast-host-profile-link" onClick={()=>setSelectedPodcastHost(host)}>{host.host_name} <span aria-hidden="true">↗</span></button>{host.host_role&&<small>{host.host_role}</small>}{host.host_bio&&<p>{host.host_bio.slice(0,150)}{host.host_bio.length>150?"…":""}</p>}</div></aside>})() : <span className="podcast-mark" aria-hidden="true">N<span>.</span></span>}</div>
        {selectedPodcastHost && <div className="podcast-host-profile-backdrop" role="presentation" onClick={event=>{if(event.target===event.currentTarget)setSelectedPodcastHost(null);}}><section className="podcast-host-profile-modal" role="dialog" aria-modal="true" aria-label={selectedPodcastHost.host_name+" profile"}><button type="button" className="podcast-host-profile-close" onClick={()=>setSelectedPodcastHost(null)} aria-label="Close profile">×</button><div className="podcast-host-profile-hero">{selectedPodcastHost.host_image_url?<img src={selectedPodcastHost.host_image_url} alt={selectedPodcastHost.host_name}/>:<span className="podcast-host-avatar">N.</span>}<div><span className="eyebrow">NOCHALANT PODCAST · HOST PROFILE</span><h2>{selectedPodcastHost.host_name}</h2><p>{selectedPodcastHost.host_role}</p><span className="podcast-host-location">BENIN CITY · EDO STATE, NIGERIA</span></div></div><div className="podcast-host-profile-body"><span className="eyebrow">ABOUT THE HOST</span><p>{selectedPodcastHost.host_bio}</p><h3>Music catalogue</h3><ul><li><strong>Do Or Die</strong><span>Hunter Of Africa, Gasky & Marvis LA · 9 October 2022</span></li><li><strong>Hunter We Wanna Party</strong></li><li><strong>My Friend & Brother</strong></li></ul><h3>Follow Hunter</h3><div className="podcast-host-socials">{selectedPodcastHost.host_instagram_url&&<a href={selectedPodcastHost.host_instagram_url} target="_blank" rel="noreferrer">Instagram ↗</a>}{selectedPodcastHost.host_tiktok_url&&<a href={selectedPodcastHost.host_tiktok_url} target="_blank" rel="noreferrer">TikTok ↗</a>}</div><small>Music catalogue and professional details are presented from supplied editorial information; further career milestones remain subject to verification.</small></div></section></div>}
        <div className="podcast-library-feature">
          <div className="podcast-library-screen podcast-player-stage">
            {activePodcastEpisode?.video_url ? <video className="podcast-video" src={activePodcastEpisode.video_url} poster={activePodcastEpisode.thumbnail_url || ""} controls playsInline preload="metadata" /> : <><div className="podcast-stage-play" aria-hidden="true"><svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="29"/><path d="M26 19.5 46 32 26 44.5Z"/></svg></div><strong>{podcastDisplayItems[selectedPodcastIndex].label.split(" ").slice(0,1).join(" ")}<br/>{podcastDisplayItems[selectedPodcastIndex].label.split(" ").slice(1).join(" ")}</strong><span>FULL EPISODES · CLIPS · SESSIONS</span></>}
          </div>
          <div className="podcast-library-copy"><span className="eyebrow">{activePodcastEpisode ? "NOW PLAYING" : `SERIES · ${String(selectedPodcastIndex+1).padStart(2,"0")} / ${String(podcastDisplayItems.length).padStart(2,"0")}`}</span><h2>{activePodcastEpisode?.title || podcastDisplayItems[selectedPodcastIndex].title} <em>on Nochalant.</em></h2><p>{activePodcastEpisode?.description || podcastDisplayItems[selectedPodcastIndex].description}</p><span className="podcast-status">{activePodcastEpisode ? "OFFICIAL NOCHALANT EPISODE" : "NEW EPISODES WILL APPEAR HERE"}</span>{activePodcastEpisode && <button className="podcast-clear-selection" type="button" onClick={() => setActivePodcastEpisode(null)}>Back to series</button>}</div>
        </div>
        <div className="podcast-selection-nav" aria-label="Choose a podcast series"><button type="button" onClick={() => {setActivePodcastEpisode(null);setPodcastSelection(index => (index - 1 + podcastDisplayItems.length) % podcastDisplayItems.length);}} aria-label="Previous podcast series">← <span>PREVIOUS</span></button><span>CHOOSE A SERIES</span><button type="button" onClick={() => {setActivePodcastEpisode(null);setPodcastSelection(index => (index + 1) % podcastDisplayItems.length);}} aria-label="Next podcast series"><span>NEXT</span> →</button></div>
        <div className="podcast-library-tabs"><span>ALL EPISODES</span><span>SEASONS</span><span>SESSIONS</span><span>CLIPS</span></div>
        <div className="podcast-episodes-heading"><span className="eyebrow">THE SERIES LIBRARY</span><h2>{podcastDisplayItems[selectedPodcastIndex].title} <em>episodes.</em></h2></div>
        {podcastCatalogueLoading ? <p className="podcast-empty-state">Loading the Nochalant catalogue…</p> : (podcastCatalogue.episodes || []).filter(episode => episode.show_id === podcastDisplayItems[selectedPodcastIndex].id).length ? <div className="podcast-episodes-grid">{podcastCatalogue.episodes.filter(episode => episode.show_id === podcastDisplayItems[selectedPodcastIndex].id).map(episode => <article className={activePodcastEpisode?.id === episode.id ? "podcast-episode-card is-playing" : "podcast-episode-card"} key={episode.id}><div className="podcast-episode-art">{episode.thumbnail_url ? <img src={episode.thumbnail_url} alt="" loading="lazy"/> : <span className="podcast-episode-monogram">N.</span>}<span className="podcast-episode-number">EP {String(episode.episode_number || "—").padStart(2,"0")}</span></div><div className="podcast-episode-copy"><strong>{episode.title}</strong><p>{episode.description || "An original Nochalant episode."}</p><button type="button" className="podcast-branded-play" onClick={() => {setActivePodcastEpisode(episode);window.scrollTo({top:0,behavior:"smooth"});}}><span>WATCH EPISODE</span><span aria-hidden="true">↗</span></button></div></article>)}</div> : <div className="podcast-empty-state"><span className="podcast-empty-mark">N.</span><strong>Episodes are on the way.</strong><p>This series is set up. Its first published episode will appear here as soon as the editorial team uploads and publishes it.</p></div>}
        <div className="podcast-library-grid">{podcastDisplayItems.map((item,index) => <button type="button" key={item.id || item.title} className={selectedPodcastIndex === index ? "podcast-library-card is-selected" : "podcast-library-card"} onClick={() => {setActivePodcastEpisode(null);setPodcastSelection(index);}} aria-pressed={selectedPodcastIndex === index}><div className={item.art}><span>{String(index+1).padStart(2,"0")}</span><b>{item.label}</b></div><div><strong>{item.title}</strong><p>{item.subtitle}</p></div></button>)}</div>
      </section> : activeScreen === "dashboard" ? <section className="account-dashboard container screen-page" aria-labelledby="account-dashboard-title"><div className="account-dashboard-head"><div><span className="eyebrow">YOUR NOCHALANT SPACE</span><h1 id="account-dashboard-title">Your dashboard<span>.</span></h1><p>Welcome back, {accountProfile?.profile?.display_name || currentUser?.name || "member"}.</p></div><div className="dashboard-account-type"><span className="account-type-chip">{ACCOUNT_TYPE_LABELS[accountProfile?.profile?.account_type || "fan"] || "Fan / Listener"}</span><small>Account type selected during registration</small></div></div>{accountProfileLoading ? <div className="account-dashboard-loading">Loading your account tools…</div> : accountProfileError ? <div className="account-dashboard-loading" role="alert">{accountProfileError} <button className="button button-outline" type="button" onClick={() => setAccountProfileRefresh(value => value + 1)}>Retry</button></div> : <><form id="member-profile-settings" className="member-profile-editor artist-studio-form" onSubmit={saveMemberProfile}>
          <div><span className="eyebrow">YOUR PUBLIC IDENTITY</span><h2>Member profile</h2><p>Set up the profile people see when you join the Nochalant community.</p></div>
          <div className="member-avatar-editor"><span className="member-avatar-preview">{accountProfile?.profileDetails?.avatar_url ? <img src={accountProfile.profileDetails.avatar_url} alt="Your profile"/> : (accountProfile?.profile?.display_name || currentUser?.name || "N").charAt(0).toUpperCase()}</span><label>Profile photo<input name="avatar" type="file" accept="image/jpeg,image/png,image/webp,image/avif"/></label></div>
          <label>Username<input name="username" minLength="3" maxLength="24" pattern="[A-Za-z0-9_]{3,24}" placeholder="your_username" defaultValue={accountProfile?.profileDetails?.username || ""}/></label>
          <label>Bio<textarea name="bio" rows="3" maxLength="280" placeholder="A little about you…" defaultValue={accountProfile?.profileDetails?.bio || ""}/></label>
          <label>Website<input name="websiteUrl" type="url" placeholder="https://example.com" defaultValue={accountProfile?.profileDetails?.website_url || ""}/></label>
          <label>Location<input name="location" maxLength="100" placeholder="City, country" defaultValue={accountProfile?.profileDetails?.location || ""}/></label>
          <button className="button button-green" disabled={memberProfileBusy}>{memberProfileBusy ? "Saving profile…" : "Save member profile"}</button>
        </form>
        <div className="account-dashboard-grid" id="account-dashboard-tools"><article className="account-dashboard-card account-dashboard-primary"><span className="eyebrow">ACCOUNT TYPE</span><h2>{({fan:"Fan & Listener",artist:"Artist / Musician",creator:"Creator / Influencer",event_organizer:"Event Organizer",business:"Business / Brand",media:"Media / Publisher"})[accountProfile?.profile?.account_type || "fan"]}</h2><p>Your dashboard is organized around the account type you selected. Your account type does not grant editorial or verification privileges.</p></article>{(accountProfile?.profile?.account_type || "fan") === "artist" ? <><article className="account-dashboard-card"><span className="eyebrow">ARTIST PROFILE</span><h3>{artistStudio?.artist?.stage_name || accountProfile?.artistProfile?.stage_name || "Your artist identity"}</h3><p>Verification: {artistStudio?.artist?.verification_status || accountProfile?.artistProfile?.verification_status || "unverified"}. Public verification is reviewed separately by Nochalant.</p><span className="dashboard-status">{(artistStudio?.artist?.verification_status || "unverified").toUpperCase()}</span></article><article className="account-dashboard-card"><span className="eyebrow">MUSIC CATALOGUE</span><h3>{artistStudio?.releases?.length || 0} release drafts &amp; submissions</h3><p>{artistStudio?.stats?.published_tracks || 0} published tracks · {Number(artistStudio?.stats?.downloads || 0).toLocaleString()} recorded downloads</p><span className="dashboard-status">LIVE ACCOUNT DATA</span></article></> : (accountProfile?.profile?.account_type || "fan") === "creator" ? <><article className="account-dashboard-card"><span className="eyebrow">CREATOR PROFILE</span><h3>Your public portfolio</h3><p>Build your creator identity, showcase work and connect with your audience.</p><span className="dashboard-status">PROFILE TO SET UP</span></article><article className="account-dashboard-card"><span className="eyebrow">BOOKINGS</span><h3>Enquiries &amp; bookings</h3><p>Manage service details, availability and booking requests.</p><span className="dashboard-status">BOOKING TOOLS IN DEVELOPMENT</span></article></> : (accountProfile?.profile?.account_type || "fan") === "event_organizer" ? <><article className="account-dashboard-card"><span className="eyebrow">EVENTS</span><h3>Your event listings</h3><p>Create event details, submit them for review and manage approved listings.</p><span className="dashboard-status">EVENT TOOLS IN DEVELOPMENT</span></article><article className="account-dashboard-card"><span className="eyebrow">ATTENDANCE</span><h3>Tickets &amp; guests</h3><p>Track event interest and attendance when ticketing is enabled.</p><span className="dashboard-status">TICKETING NOT CONNECTED</span></article></> : (accountProfile?.profile?.account_type || "fan") === "business" ? <><article className="account-dashboard-card"><span className="eyebrow">BRAND PROFILE</span><h3>Your business presence</h3><p>Showcase your brand, services and approved promotions.</p><span className="dashboard-status">PROFILE TO SET UP</span></article><article className="account-dashboard-card"><span className="eyebrow">PROMOTIONS</span><h3>Campaigns</h3><p>Prepare sponsored placements with transparent labels and editorial review.</p><span className="dashboard-status">CAMPAIGN TOOLS IN DEVELOPMENT</span></article></> : (accountProfile?.profile?.account_type || "fan") === "media" ? <><article className="account-dashboard-card"><span className="eyebrow">PUBLISHER PROFILE</span><h3>Media submissions</h3><p>Manage publisher identity and submit coverage for editorial consideration.</p><span className="dashboard-status">PUBLISHER TOOLS IN DEVELOPMENT</span></article></> : <><article className="account-dashboard-card"><span className="eyebrow">YOUR ACTIVITY</span><h3>Saved culture &amp; follows</h3><p>Keep up with artists, creators, conversations and events you follow.</p><span className="dashboard-status">MEMBER TOOLS IN DEVELOPMENT</span></article><article className="account-dashboard-card"><span className="eyebrow">COMMUNITY</span><h3>Social &amp; opinions</h3><p>Join conversations, share posts and take part in community voting.</p><span className="dashboard-status">MEMBER ACCESS</span></article></>}</div>{(accountProfile?.profile?.account_type || "fan") === "artist" && <div className="artist-studio-tools" id="artist-studio-tools"><div className="artist-studio-heading"><div><span className="eyebrow">ARTIST WORKSPACE</span><h2>Manage your <em>sound.</em></h2><p>Build your artist identity and prepare music releases for review.</p></div></div>{artistStudioError && <p className="artist-studio-error" role="alert">{artistStudioError}</p>}<div className="artist-studio-forms"><form className="artist-studio-form" onSubmit={e => submitArtistStudio(e,"update_profile")}><h3>Artist profile</h3><label>Stage / artist name<input name="stageName" required maxLength="100" defaultValue={artistStudio?.artist?.stage_name || ""}/></label><label>Short biography<textarea name="bio" rows="4" maxLength="3000" defaultValue={artistStudio?.artist?.bio || ""}/></label><label>City<input name="city" maxLength="100" defaultValue={artistStudio?.artist?.city || ""}/></label><label>Profile image<input name="avatarFile" type="file" accept="image/jpeg,image/png,image/webp,image/avif,.jpg,.jpeg,.png,.webp,.avif"/></label><label>Banner image<input name="bannerFile" type="file" accept="image/jpeg,image/png,image/webp,image/avif,.jpg,.jpeg,.png,.webp,.avif"/></label><small className="fine-print">Optional. JPEG, PNG, WebP or AVIF, up to 15 MB each. Leave blank to keep your current images.</small><button className="button button-green" disabled={artistStudioBusy}>{artistStudioBusy ? "Saving…" : "Save artist profile"}</button></form><form className="artist-studio-form" onSubmit={e => submitArtistStudio(e,"create_release")}><h3>Start a music release</h3><label>Release title<input name="title" required maxLength="180" placeholder="Your single or album title"/></label><label>Release type<select name="releaseType" defaultValue="single"><option value="single">Single</option><option value="ep">EP</option><option value="album">Album</option><option value="mixtape">Mixtape</option></select></label><label>Genre<input name="genre" required maxLength="80" placeholder="Afrobeats, Amapiano…"/></label><label>Release date<input name="releaseDate" type="date"/></label><label>Cover artwork<input name="coverArtFile" type="file" accept="image/jpeg,image/png,image/webp,image/avif,.jpg,.jpeg,.png,.webp,.avif"/></label><small className="fine-print">Optional JPEG, PNG, WebP or AVIF artwork, up to 15 MB.</small><button className="button button-green" disabled={artistStudioBusy}>{artistStudioBusy ? "Saving…" : "Save release draft"}</button><small className="fine-print">Audio and cover artwork upload directly to private Neon Storage. A saved draft is not published.</small>
</form></div>
<form className="artist-studio-form artist-track-form" onSubmit={e => submitArtistStudio(e,"add_track")}>
<h3>Add a track</h3>
<label>Draft release<select name="releaseId" required defaultValue=""><option value="" disabled>Choose your release</option>{(artistStudio?.releases || []).filter(release => release.status === "draft").map(release => <option key={release.id} value={release.id}>{release.title}</option>)}</select></label>
<label>Track title<input name="title" required maxLength="180" placeholder="Track title"/></label>
<label>Audio file<input name="audioFile" type="file" required accept=".mp3,.m4a,.aac,.wav,.flac,.ogg,.webm,audio/mpeg,audio/mp4,audio/aac,audio/wav,audio/flac,audio/ogg,audio/webm"/></label>
<label>Duration (seconds)<input name="durationSeconds" type="number" min="1" max="86400" placeholder="Optional"/></label>
<label>ISRC (optional)<input name="isrc" maxLength="20" placeholder="Track ISRC"/></label>
<button className="button button-green" disabled={artistStudioBusy || !(artistStudio?.releases || []).some(release => release.status === "draft")}>{artistStudioBusy ? "Saving…" : "Add track to release"}</button>
<small className="fine-print">Upload MP3, M4A, AAC, WAV, FLAC, OGG or WebM audio up to 100 MB. Files upload directly to private Neon Storage; tracks remain pending until editorial approval.</small>
</form>
<div className="artist-release-list"><h3>Your releases</h3>{artistStudio?.releases?.length ? artistStudio.releases.map(release => <div className="artist-release-row" key={release.id}><div><strong>{release.title}</strong><small>{release.release_type.toUpperCase()} · {release.genre} · {release.track_count} tracks</small></div><span className="dashboard-status">{release.status.toUpperCase()}</span>{release.status === "draft" && <button className="button button-outline" disabled={artistStudioBusy} onClick={async () => {setArtistStudioBusy(true);try{const token=await getAuthToken();const response=await fetch("/api/artist/studio",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},body:JSON.stringify({action:"submit_release",releaseId:release.id})});const data=await response.json().catch(()=>({}));if(!response.ok||!data.ok)throw new Error(data.error||"Release could not be submitted.");const refreshed=await fetch("/api/artist/studio",{headers:{Authorization:`Bearer ${token}`},cache:"no-store"});const latest=await refreshed.json().catch(()=>({}));if(refreshed.ok&&latest.ok)setArtistStudio(latest);notify("Release sent for editorial review.");}catch(error){setArtistStudioError(error.message||"Release submission failed.");}finally{setArtistStudioBusy(false);}}}>Submit for review</button>}</div>) : <p className="fine-print">No releases yet. Create your first release draft above.</p>}</div></div>}<div className="account-dashboard-footer"><button className="button button-outline" onClick={() => setActiveScreen("home")}>Back to Nochalant</button></div></>}</section> : null}
    </main>
    {activeScreen === "home" && (
      <section className="home-podcast-section container" aria-labelledby="home-podcast-title">
              <div className="home-podcast-head"><div><span className="eyebrow">NOCHALANT PODCAST</span><h2 id="home-podcast-title">Watch the <em>latest episode.</em></h2><p>Unfiltered conversations. Culture. Music. People. Only on Nochalant Podcast.</p></div><button className="podcast-see-more" onClick={() => {setActiveScreen("podcast");window.scrollTo({top:0,behavior:"smooth"});}}>See more <span>→</span></button></div>
              <div className="podcast-feature-player"><div className="podcast-screen"><div className="podcast-screen-brand"><span className="podcast-screen-mark">N.</span><strong>NOCHALANT<br/>PODCAST</strong></div><span className="podcast-screen-status">NOCHALANT ORIGINALS · EPISODES COMING SOON</span></div><div className="podcast-player-meta"><div><span className="podcast-status">FEATURED SHOW</span><h3>Nochalant Podcast</h3><p>Original conversations from the culture desk</p></div><button type="button" className="podcast-brand-emblem" onClick={() => {setActiveScreen("podcast");window.scrollTo({top:0,behavior:"smooth"});}} aria-label="Open Nochalant Podcast"><svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="30"/><path d="M18 17v30h7V28l17 19h5V17h-7v19L23 17z"/><path d="m30 26 13 7-13 7z" className="podcast-brand-play-cut"/></svg></button></div></div>
      </section>
    )}

    {activeScreen === "home" && <section className="newsletter-section container" aria-labelledby="newsletter-title">
      <div className="newsletter-copy"><span className="eyebrow">THE NOCHALANT DROP</span><h2 id="newsletter-title">The gist, straight to <em>you.</em></h2><p>Fresh stories, new music and what's happening next. No noise.</p></div>
      <form className="newsletter-form" onSubmit={e => {e.preventDefault();setModal("newsletter-success");}}>
        <label className="sr-only" htmlFor="newsletter-email">Your email address</label>
        <input id="newsletter-email" type="email" required value={newsletterEmail} onChange={e => setNewsletterEmail(e.target.value)} placeholder="Your email address"/>
        <button type="submit">Gimme Update</button>
      </form>
    </section>}
    {!currentUser?.id && <footer className="footer"><div className="container footer-main footer-main-expanded"><div className="footer-about"><a className="brand footer-brand" href="#top">NOCHALANT<span>.</span></a><p>Nigeria’s premier high-energy entertainment network. Bringing you the hottest Afrobeats gist, Nollywood drama, and street buzz with zero form!</p></div><div className="footer-column"><h3>QUICK NAVIGATION</h3><a href="#latest">Afrobeats Top 50</a><a href="#latest">Nollywood Box Office</a><a href="#hot-or-trash">BBNaija Highlights</a><a href="#latest">Celebrity Fashion &amp; Glam</a></div><div className="footer-column footer-confidential"><h3>GOT CONFIDENTIAL GIST?</h3><p>Drop hot tips, video evidence or street gist anonymously. No account or registration needed.</p><button className="footer-anonymous" onClick={() => setModal("submit")}><svg className="anonymous-mark" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 10h18M5 10l1.5-5h11L19 10M7 14a3 3 0 1 0 6 0M11 14a3 3 0 1 0 6 0M3 14h2m14 0h2"/></svg><span>Spill Anonymous Gist</span></button><div className="footer-social"><h3>CONNECT WITH THE SWAG</h3><div className="footer-social-links"><a href="https://www.instagram.com/" target="_blank" rel="noreferrer" aria-label="Instagram"><svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1"/></svg></a><a href="https://www.facebook.com/" target="_blank" rel="noreferrer" aria-label="Facebook"><svg viewBox="0 0 24 24"><path d="M14 21v-8h3l.5-4H14V7c0-1.2.4-2 2-2h2V1.4C17.2 1.2 16.1 1 15 1c-3.3 0-5.5 2-5.5 5.7V9H6v4h3.5v8z"/></svg></a><a href="https://www.tiktok.com/" target="_blank" rel="noreferrer" aria-label="TikTok"><svg viewBox="0 0 24 24"><path d="M15 3c.4 2.2 1.7 3.5 4 3.7v3.2a8 8 0 0 1-4-1.2v6.5a6 6 0 1 1-6-6h1v3.4h-1a2.6 2.6 0 1 0 2.6 2.6V3z"/></svg></a><a href="https://www.youtube.com/" target="_blank" rel="noreferrer" aria-label="YouTube"><svg viewBox="0 0 24 24"><path d="M23 7a3 3 0 0 0-2-2C19 4.5 12 4.5 12 4.5s-7 0-9 .5a3 3 0 0 0-2 2A31 31 0 0 0 .5 12 31 31 0 0 0 1 17a3 3 0 0 0 2 2c2 .5 9 .5 9 .5s7 0 9-.5a3 3 0 0 0 2-2 31 31 0 0 0 .5-5A31 31 0 0 0 23 7zM10 15.5v-7l6 3.5z"/></svg></a></div></div></div></div><div className="container footer-bottom"><span>© 2026 Nochalant Media Nigeria Ltd. All Rights Reserved.</span><span className="footer-credit">Powered by Squadglobal.</span></div></footer>}

    <audio ref={audioRef} preload="metadata" />
    {audioPlayerVisible ? <div className={"mini-player-dock"+(currentUser?.id?" member-player-dock":"")+(playerDockPosition?" is-positioned":"")+(playerDockDragging?" is-dragging":"")} style={playerDockPosition ? {left:playerDockPosition.left+"px",top:playerDockPosition.top+"px",right:"auto",bottom:"auto"} : undefined} onPointerDown={handlePlayerDockPointerDown} onPointerMove={handlePlayerDockPointerMove} onPointerUp={handlePlayerDockPointerUp} onPointerCancel={handlePlayerDockPointerUp}>
      <section className="mini-player" aria-label="Nochalant audio player">
        <img className="player-artwork" src={activeAudioTrack?.cover_art_url || demoStories[0].image} alt={activeAudioTrack ? activeAudioTrack.title + " cover art" : "Nochalant player artwork"}/>
        <div className="player-main">
          <div className="player-title"><b>{activeAudioTrack?.title || "Nochalant Player"}</b><small>{audioError ? "Audio unavailable — tap play to retry" : activeAudioTrack?.artist_name || "Select a released track to listen"}</small></div>
          <div className="player-progress">
            <span>{formatAudioTime(audioCurrent)}</span>
            <input aria-label="Seek audio" type="range" min="0" max={audioDuration || 0} step="0.1" value={Math.min(audioCurrent, audioDuration || 0)} onChange={seekAudio} disabled={!audioDuration} />
            <span>{formatAudioTime(audioDuration)}</span>
          </div>
        </div>
        <div className="player-inline-queue" aria-label="Track navigation">
          <button type="button" onClick={() => moveAudioQueue(-1)} disabled={!audioQueue.length} aria-label="Previous track">‹</button>
          <button type="button" onClick={() => moveAudioQueue(1)} disabled={!audioQueue.length} aria-label="Next track">›</button>
        </div>
        <button className="player-toggle" onClick={toggleAudio} aria-label={audioPlaying ? "Pause audio" : "Play audio"}><span className={audioPlaying ? "player-pause-symbol" : "player-play-symbol"} aria-hidden="true"/></button>
        <button className="player-close" onClick={event => {const rect=event.currentTarget.closest(".mini-player-dock")?.getBoundingClientRect();if(rect){setPlayerButtonPosition({left:rect.left,top:rect.top});setPlayerDockPosition({left:rect.left,top:rect.top});}setAudioPlayerVisible(false);}} aria-label="Minimize player" title="Minimize player">×</button>
      </section>
    </div> : <button type="button" className={"player-reopen"+(currentUser?.id?" member-player-reopen":"")}
      style={playerButtonPosition ? {left:playerButtonPosition.left+"px",top:playerButtonPosition.top+"px",right:"auto",bottom:"auto"} : undefined}
      onPointerDown={handlePlayerButtonPointerDown} onPointerMove={handlePlayerButtonPointerMove}
      onPointerUp={handlePlayerButtonPointerUp} onPointerCancel={handlePlayerButtonPointerUp}
      onClick={() => {if (playerButtonDraggedRef.current) {playerButtonDraggedRef.current=false;return;} if(playerButtonPosition)setPlayerDockPosition(playerButtonPosition); setAudioPlayerVisible(true);}}
      aria-label="Open Nochalant audio player" title="Open Nochalant player">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 14V10M8 18V6M12 15V9M16 19V5M20 14V10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
    </button>}

    {currentUser?.id && memberDockEnabled && <nav className={"member-app-dock"+(memberDockHidden?" is-hidden":"")} aria-label="Nochalant member navigation">
      <button type="button" className={memberDockTab==="home"?"active":""} onClick={()=>navigateMemberDock("home")} aria-label="Home"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 10.8 12 3l9 7.8v9a1.2 1.2 0 0 1-1.2 1.2h-5.2v-6.2H9.4V21H4.2A1.2 1.2 0 0 1 3 19.8z"/></svg><span>HOME</span></button>
      <button type="button" className={memberDockTab==="music"?"active":""} onClick={()=>navigateMemberDock("music")} aria-label="Music"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18V5l12-2v13M9 18a3 3 0 1 1-3-3c1.7 0 3 1.3 3 3Zm12-2a3 3 0 1 1-3-3c1.7 0 3 1.3 3 3Z"/></svg><span>MUSIC</span></button>
      <button type="button" className="dock-create" onClick={()=>navigateMemberDock("create")} aria-label="Create"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg></button>
      <button type="button" className={memberDockTab==="socials"?"active":""} onClick={()=>navigateMemberDock("socials")} aria-label="Socials"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8" r="3"/><path d="M3 20c0-3.2 2.7-5.5 6-5.5s6 2.3 6 5.5M16 5.5a3 3 0 0 1 0 5.8M17 14.5c2.4.6 4 2.5 4 5"/></svg><span>SOCIALS</span></button>
      <button type="button" className={"dock-more"+(memberDockTab==="more"?" active":"")} onClick={()=>navigateMemberDock("more")} aria-label="More"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg><span>MORE</span></button>
    </nav>}
    {modal && <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && closeModal()}><div className="modal-card" role="dialog" aria-modal="true" aria-labelledby="modal-title"><button ref={modalCloseRef} className="modal-close" onClick={closeModal} aria-label="Close dialog">×</button>
      {modal === "artist-profile" && <div className="artist-profile-modal">
        {artistProfileLoading ? <p className="artist-profile-loading">Loading artist profile…</p> : artistProfileError ? <p className="artist-profile-loading" role="alert">{artistProfileError}</p> : selectedArtist && <>
          <div className="artist-profile-hero" style={selectedArtist.banner_url ? {backgroundImage: 'linear-gradient(0deg,#0b0d09 0%,#0b0d0988 100%),url("' + selectedArtist.banner_url + '")'} : undefined}>
            {selectedArtist.image_url && <img src={selectedArtist.image_url} alt={selectedArtist.name + " artist portrait"} />}
            <div><span className="eyebrow">NOCHALANT VERIFIED ARTIST</span><h2 id="modal-title">{selectedArtist.name}</h2><p>{[selectedArtist.city, selectedArtist.country_code].filter(Boolean).join(" · ")}</p></div>
          </div>
          <section className="artist-profile-bio"><span className="eyebrow">ARTIST BIO</span><p>{selectedArtist.bio || "Artist biography coming soon."}</p>{selectedArtist.genre && <span className="artist-profile-genre">{selectedArtist.genre}</span>}</section>
          <section className="artist-profile-discography"><span className="eyebrow">RELEASED ON NOCHALANT</span><h3>Tracks & releases</h3>
            {selectedArtist.tracks?.length ? selectedArtist.tracks.map(track => <article className="artist-profile-track" key={track.id}>
              <img src={track.cover_art_url || selectedArtist.image_url || ""} alt="" />
              <div><strong>{track.title}</strong><small>{track.release_title}</small><span><span>▶ {Number(track.plays_count || 0).toLocaleString()}</span><span>↓ {Number(track.download_count || 0).toLocaleString()}</span></span></div>
              <button type="button" onClick={() => playArtistTrack(track, selectedArtist.tracks)} disabled={!track.audio_url} aria-label={"Play " + track.title}>▶</button>
            </article>) : <p className="artist-profile-loading">No published tracks yet.</p>}
          </section>
        </>}
      </div>}
      {modal === "newsletter-success" && <div className="newsletter-success"><span className="brand-signature" aria-hidden="true">N</span><span className="eyebrow">YOU'RE IN THE LOOP</span><h2 id="modal-title">Good things are coming.</h2><p>Thanks for wanting the Nochalant update. Email signups aren't connected yet, so your address hasn't been saved.</p><button className="button button-green full-width" onClick={closeModal}>Got you</button></div>}
      {modal === "story" && <><span className="eyebrow">{story.category} · {story.label}</span><h2 id="modal-title">{story.title}</h2><div className="article-byline"><span>By {story.author}</span><span>{typeof viewCounts[story.id] === "number" ? `${viewCounts[story.id].toLocaleString()} views` : "Reader count loading"}</span><span>{story.read}</span></div><img className="modal-story-image" src={story.image} alt=""/><p>{story.body}</p><div className="comment-area"><h3>Join the conversation</h3>{(comments[story.id] || []).map((comment, index) => <p className="comment" key={index}>{comment}</p>)}<form onSubmit={addComment}><label className="sr-only" htmlFor="comment-input">Your comment</label><textarea id="comment-input" rows="3" value={commentDraft} onChange={e => setCommentDraft(e.target.value)} placeholder="Drop your comment..."/><button className="button button-green" type="submit">Post comment</button></form><small className="fine-print">Comments are stored only in this browser preview.</small></div></>}
      {modal === "submit" && <><span className="eyebrow">YOUR STORY. YOUR PLATFORM.</span><h2 id="modal-title">Spill the <em>gist.</em></h2><p className="modal-intro">Send a tip or story anonymously. No account, sign-in or registration is required. Every anonymous gist is archived privately for editorial review, with a target review window of up to 7 days.</p><form onSubmit={submitGist}><label>Category<select name="category" value={submissionCategories.includes(formCategory) ? formCategory : "Entertainment"} onChange={e => setFormCategory(e.target.value)}>{submissionCategories.map(x => <option key={x} value={x}>{x}</option>)}</select></label><label>Post title<input name="title" required minLength="8" maxLength="180" placeholder="Give your gist a clear title"/></label><label>Tell us the full gist<textarea name="body" required minLength="20" maxLength="12000" rows="5" placeholder="Add details, links and useful context..."/></label><label>Source link (optional)<input name="sourceUrl" type="url" placeholder="https://..."/></label><label className="check-label"><input type="checkbox" required/> I confirm this submission is accurate and I have permission to share its content.</label><button className="button button-green full-width" type="submit">Send anonymous gist</button><small className="fine-print">Your identity is not requested. Your submission remains private and pending until an editor reviews it.</small></form></>}
      {(modal === "signup" || modal === "login") && <><span className="eyebrow">JOIN THE CULTURE</span><h2 id="modal-title">{modal === "signup" ? "Create your account." : "Welcome back."}</h2><p className="modal-intro">Sign in or create your Nochalant account securely.</p><form onSubmit={submitAuth}>{modal === "signup" && <><label>Full name<input name="name" required placeholder="Your name"/></label><label>Choose your account type<select name="accountType" defaultValue="fan"><option value="fan">Fan / Listener</option><option value="artist">Artist / Musician</option><option value="creator">Creator / Influencer</option><option value="event_organizer">Event Organizer</option><option value="business">Business / Brand</option><option value="media">Media / Publisher</option></select></label><small className="fine-print">Your account type personalizes your dashboard and tools. Artist verification and publishing approval are separate steps.</small></>}<label>Email address<input name="email" type="email" required placeholder="you@example.com"/></label><label>Password<input name="password" type="password" required minLength="8" placeholder="At least 8 characters"/></label><button className="button button-green full-width" type="submit" disabled={authBusy}>{authBusy ? "Please wait…" : modal === "signup" ? "Create account" : "Log in"}</button>{authMessage && <small className="fine-print" role="status">{authMessage}</small>}</form><button className="switch-modal" onClick={() => setModal(modal === "signup" ? "login" : "signup")}>{modal === "signup" ? "Already registered? Log in" : "New here? Register"}</button></>}
    </div></div>}
    {selectedOpinion && <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && setSelectedOpinion(null)}><div className="modal-card opinion-detail" role="dialog" aria-modal="true" aria-labelledby="opinion-detail-title"><button className="modal-close" onClick={() => setSelectedOpinion(null)} aria-label="Close opinion">×</button><span className="eyebrow">{selectedOpinion.topic} · NOCHALANT OPINION</span><h2 id="opinion-detail-title">The people have a say.</h2><blockquote>“{selectedOpinion.body}”</blockquote><p className="opinion-author-detail">Shared by {selectedOpinion.author_name}</p><div className="opinion-detail-actions"><button className="button button-outline full-width" onClick={() => {if (!currentUser) {setSelectedOpinion(null);setModal("login");setAuthMessage("Log in to report content.");} else {setReportOpinion(selectedOpinion);setSelectedOpinion(null);setOpinionsPanelMode("report");setOpinionsPanelOpen(true);}}}>Report this opinion</button><button className="button button-green full-width" onClick={() => {setSelectedOpinion(null);if (!currentUser) setModal("login");else {setOpinionsPanelMode("dashboard");setOpinionsPanelOpen(true);}}}>Share your take</button></div></div></div>}
    {opinionsPanelOpen && <DeferredPanel><OpinionsPanel open={opinionsPanelOpen} mode={opinionsPanelMode} opinion={reportOpinion} onClose={() => setOpinionsPanelOpen(false)} onNotice={notify} /></DeferredPanel>}
    {toast && <div className="toast" role="status">{toast}</div>}
  </div>;
}
createRoot(document.getElementById("root")).render(<App />);
