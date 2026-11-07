"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Bell, Bookmark, ChevronRight, Compass, Crown, Flame, Heart, Home,
  MessageCircle, Mic2, Music2, Plus, Search, Send, ShieldCheck,
  Sparkles, Users, UserRound, Zap, Ghost, Eye, Moon, Diamond
} from "lucide-react";

const interests = ["For You", "Following", "Scenes", "Music", "Nightlife"];
const scenes = [
  { name: "Alté Society", category: "Culture · Lagos", members: "23.4K", icon: "✳", tone: "rose", verified: true },
  { name: "Afterhours", category: "Nightlife · Lagos", members: "18.7K", icon: "☾", tone: "violet", verified: true },
  { name: "Sound District", category: "Music · Nigeria", members: "12.1K", icon: "♫", tone: "blue", verified: false },
  { name: "The Drip Room", category: "Fashion · Lagos", members: "16.9K", icon: "◇", tone: "amber", verified: true },
];
const identities = [
  { name: "Royalty", icon: Crown }, { name: "Fire", icon: Flame },
  { name: "Phantom", icon: Ghost }, { name: "Electric", icon: Zap },
  { name: "Rebel", icon: ShieldCheck }, { name: "Night Owl", icon: Moon },
  { name: "Elite", icon: Diamond }, { name: "Sound", icon: Music2 },
  { name: "Observer", icon: Eye }, { name: "Warrior", icon: Users },
  { name: "Icon", icon: Sparkles }, { name: "Voice", icon: Mic2 },
  { name: "Rare", icon: Diamond }, { name: "Lover", icon: Heart },
];

export default function ClubHomePage() {
  const [activeTab, setActiveTab] = useState("For You");
  const [joined, setJoined] = useState<string[]>(["Alté Society"]);
  const [liked, setLiked] = useState<string[]>([]);
  const [saved, setSaved] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const filteredScenes = useMemo(() => scenes.filter((scene) => scene.name.toLowerCase().includes(query.toLowerCase())), [query]);

  function toggle(value: string, list: string[], setter: (next: string[]) => void) {
    setter(list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);
  }

  return (
    <main className="min-h-screen bg-[#070708] pb-28 text-white">
      <div className="mx-auto min-h-screen w-full max-w-[1180px] px-4 sm:px-6">
        <header className="sticky top-0 z-30 -mx-4 flex items-center justify-between border-b border-white/10 bg-[#09090bf2] px-4 py-3 backdrop-blur-xl sm:-mx-6 sm:px-6">
          <Link href="/home" className="text-decoration-none text-[25px] font-black tracking-[-.09em] text-white no-underline">
            Nochalant<span className="text-[#ed2939]">.</span><small className="ml-2 text-[9px] font-bold tracking-[.38em] text-white/65">CLUB</small>
          </Link>
          <div className="hidden max-w-md flex-1 items-center gap-3 rounded-full border border-white/10 bg-white/[.04] px-4 py-2 md:flex">
            <Search size={17} className="text-white/45" />
            <input aria-label="Search Nochalant" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search Scenes, people and music..." className="w-full bg-transparent text-sm outline-none placeholder:text-white/35" />
          </div>
          <div className="flex items-center gap-3">
            <button aria-label="Notifications" className="relative rounded-full p-2 text-white/75 hover:bg-white/10"><Bell size={20}/><i className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[#ed2939]"/></button>
            <Link href="/my-club" aria-label="My Club ID" className="grid h-9 w-9 place-items-center rounded-full border border-[#ed2939]/70 bg-[#241014] text-sm font-bold text-white no-underline">N</Link>
          </div>
        </header>

        <section className="grid gap-7 py-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0">
            <div className="mb-6 flex items-end justify-between gap-3">
              <div><p className="mb-2 text-[10px] font-black uppercase tracking-[.24em] text-[#ed4653]">Your people. Your scene. Your rules.</p><h1 className="text-3xl font-black tracking-[-.06em] sm:text-4xl">The Club <span className="text-white/40">is yours.</span></h1><p className="mt-2 text-sm text-white/50">Find your people. Get into the conversation.</p></div>
              <Link href="/discover" className="hidden items-center gap-1 text-sm font-bold text-[#ff6670] no-underline sm:flex">Explore Scenes <ChevronRight size={16}/></Link>
            </div>

            <div className="mb-6 flex gap-3 overflow-x-auto pb-2">
              {["Your Story", "Afterhours", "Alté Society", "Sound District", "The Drip"].map((name, i) => (
                <button key={name} className="flex min-w-[68px] flex-col items-center gap-2 border-0 bg-transparent text-[10px] text-white/65">
                  <span className={`grid h-[58px] w-[58px] place-items-center rounded-full border-2 text-lg font-black ${i === 0 ? "border-[#ed2939] bg-[#241014] text-[#ff6670]" : "border-white/20 bg-gradient-to-br from-[#31222b] to-[#111114]"}`}>{i === 0 ? <Plus size={22}/> : ["", "A", "✳", "♫", "◇"][i]}</span>{name}
                </button>
              ))}
            </div>

            <div className="mb-5 flex gap-2 overflow-x-auto border-b border-white/10 pb-3">
              {interests.map((tab) => <button key={tab} onClick={() => setActiveTab(tab)} className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold transition ${activeTab === tab ? "bg-[#ed2939] text-white" : "border border-white/10 bg-white/[.04] text-white/65 hover:bg-white/10"}`}>{tab}</button>)}
            </div>

            <article className="mb-5 overflow-hidden rounded-2xl border border-white/10 bg-[#121214]">
              <div className="flex items-center gap-3 p-4">
                <div className="grid h-10 w-10 place-items-center rounded-full border border-[#ed2939]/60 bg-[#281117] font-black text-[#ff6570]">A</div>
                <div><p className="text-sm font-bold">Afterhours <span className="text-[#ed4653]">✦</span></p><p className="text-xs text-white/40">Scene conversation · 2h ago</p></div>
                <button aria-label="More post options" className="ml-auto text-xl text-white/50">···</button>
              </div>
              <div className="px-4 pb-4"><p className="text-sm leading-6 text-white/90">Best club in Lagos right now? Drop your spot and tell us what makes the night. 👀</p></div>
              <div className="relative flex min-h-[220px] flex-col items-center justify-center overflow-hidden bg-[radial-gradient(ellipse_at_50%_110%,#9d173a,transparent_58%),linear-gradient(135deg,#21101a,#09090b_70%)] text-center">
                <span className="text-[10px] font-black tracking-[.4em] text-[#ffb4bf]">LAGOS AFTER DARK</span><strong className="mt-3 text-4xl font-black tracking-[-.06em] text-white sm:text-5xl">AFTERHOURS</strong><span className="mt-2 text-xs tracking-[.28em] text-white/55">THE CITY NEVER SLEEPS</span>
              </div>
              <div className="flex items-center gap-5 p-4">
                <button onClick={() => toggle("afterhours", liked, setLiked)} className={`flex items-center gap-2 text-xs ${liked.includes("afterhours") ? "text-[#ff5967]" : "text-white/60"}`}><Heart size={18} fill={liked.includes("afterhours") ? "currentColor" : "none"}/> {liked.includes("afterhours") ? 429 : 428}</button>
                <Link href="/chats" className="flex items-center gap-2 text-xs text-white/60 no-underline"><MessageCircle size={18}/> 96</Link>
                <button onClick={() => toggle("afterhours", saved, setSaved)} aria-label="Save post" className={`ml-auto ${saved.includes("afterhours") ? "text-[#ff5967]" : "text-white/60"}`}><Bookmark size={18} fill={saved.includes("afterhours") ? "currentColor" : "none"}/></button>
              </div>
            </article>

            <div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-extrabold tracking-tight">Find your Scene</h2><Link href="/discover" className="text-xs font-bold text-[#ff6670] no-underline">See all →</Link></div>
            <div className="grid gap-3 sm:grid-cols-2">
              {filteredScenes.map((scene) => <div key={scene.name} className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#121214] p-3">
                <div className={`grid h-14 w-14 place-items-center rounded-xl text-2xl font-bold ${scene.tone === "rose" ? "bg-[#401c2b]" : scene.tone === "violet" ? "bg-[#29203f]" : scene.tone === "blue" ? "bg-[#182a3a]" : "bg-[#382a17]"}`}>{scene.icon}</div>
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{scene.name} {scene.verified && <span className="text-[#ed4653]">✦</span>}</p><p className="mt-1 text-[11px] text-white/45">{scene.category}</p><p className="mt-1 text-[10px] text-white/35">{scene.members} members</p></div>
                <button onClick={() => toggle(scene.name, joined, setJoined)} className={`rounded-full px-3 py-2 text-[11px] font-bold ${joined.includes(scene.name) ? "border border-white/15 bg-white/[.06] text-white/65" : "bg-[#ed2939] text-white"}`}>{joined.includes(scene.name) ? "Joined" : "Join"}</button>
              </div>)}
            </div>
          </div>

          <aside className="hidden space-y-5 lg:block">
            <section className="rounded-2xl border border-white/10 bg-[#121214] p-5">
              <div className="mb-4 flex items-center justify-between"><h2 className="font-extrabold">Your Club ID</h2><Link href="/my-club" className="text-xs text-[#ff6670] no-underline">View</Link></div>
              <div className="rounded-xl border border-[#ed2939]/45 bg-[radial-gradient(circle_at_90%_0%,#4b1721,transparent_50%),#0b0b0d] p-4">
                <div className="flex items-center gap-2 text-sm font-black tracking-tight">♛ NOCHALANT <span className="text-[9px] tracking-[.3em] text-white/55">CLUB</span></div>
                <p className="mt-6 text-xl font-black">YOUR CLUB ID</p><p className="mt-1 text-xs text-white/45">Choose your identity. Build your reputation.</p>
                <div className="mt-5 flex items-center gap-2 text-xs text-[#ff6975]"><Crown size={16}/> New Face <span className="ml-auto text-white/40">LV 01</span></div>
              </div>
              <p className="mt-3 text-[11px] text-white/40">Your rank grows through meaningful participation.</p>
            </section>
            <section className="rounded-2xl border border-white/10 bg-[#121214] p-5">
              <div className="mb-4 flex items-center justify-between"><h2 className="font-extrabold">Identity collection</h2><span className="text-[10px] text-white/35">Preview</span></div>
              <div className="grid grid-cols-4 gap-2">{identities.slice(0,8).map(({name,icon:Icon})=><div key={name} className="flex flex-col items-center gap-2 rounded-lg bg-white/[.035] p-2 text-center"><Icon size={21} className="text-[#ed4653]"/><span className="text-[9px] text-white/60">{name}</span></div>)}</div>
              <Link href="/my-club" className="mt-4 flex items-center justify-center gap-2 text-xs font-bold text-[#ff6670] no-underline">Explore all identities <ChevronRight size={14}/></Link>
            </section>
            <section className="rounded-2xl border border-white/10 bg-[#121214] p-5">
              <h2 className="mb-3 font-extrabold">Your Club, your spaces</h2>
              <div className="space-y-3">{[{name:"Discover",desc:"Explore Scenes and people",href:"/discover",Icon:Compass},{name:"Channels",desc:"Chats and conversations",href:"/chats",Icon:MessageCircle},{name:"Squads",desc:"Your private groups",href:"/squads",Icon:Users},{name:"Live Rooms",desc:"Voice and live discussions",href:"/listening-room",Icon:Mic2},{name:"Listening Room",desc:"Discover music and artists",href:"/listening-room",Icon:Music2}].map(({name,desc,href,Icon})=><Link key={name} href={href} className="flex items-center gap-3 text-white no-underline"><span className="grid h-9 w-9 place-items-center rounded-lg bg-[#ed2939]/10 text-[#ff5967]"><Icon size={18}/></span><span className="flex-1"><strong className="block text-xs">{name}</strong><small className="text-[10px] text-white/40">{desc}</small></span><ChevronRight size={15} className="text-white/30"/></Link>)}</div>
            </section>
          </aside>
        </section>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto flex h-[76px] max-w-[1180px] items-center justify-around border-t border-white/10 bg-[#09090bf5] px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl">
        {[
          {name:"Home",href:"/home",Icon:Home,active:true},{name:"Explore",href:"/discover",Icon:Compass},{name:"Create",href:"/create",Icon:Plus,create:true},{name:"Chat",href:"/chats",Icon:MessageCircle},{name:"Me",href:"/my-club",Icon:UserRound}
        ].map(({name,href,Icon,active,create})=><Link key={name} href={href} className={`flex min-w-14 flex-col items-center gap-1 text-[10px] no-underline ${active ? "text-[#ff5967]" : "text-white/45"}`}><span className={`grid h-9 w-9 place-items-center rounded-full ${create ? "bg-[#ed2939] text-white" : ""}`}><Icon size={create ? 22 : 21}/></span>{name}</Link>)}
      </nav>
    </main>
  );
}
