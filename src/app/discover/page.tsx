"use client";
import Link from "next/link";
import { useMemo, useState } from "react";

const scenes=[
  {name:"Alté Society",members:"23.4K members",count:23400,category:"Music",desc:"Alternative culture, music, fashion and creative expression.",letter:"A",tone:"violet"},
  {name:"Afterhours",members:"18.7K members",count:18700,category:"Nightlife",desc:"Nightlife, clubs, events and afterparty stories.",letter:"A",tone:"pink"},
  {name:"Sound District",members:"12.1K members",count:12100,category:"Music",desc:"New music, underground drops, producers and artist talks.",letter:"S",tone:"silver"},
  {name:"The Drip Room",members:"16.9K members",count:16900,category:"Fashion",desc:"Outfits, sneakers, style and fashion battles.",letter:"D",tone:"orange"},
  {name:"Campus Frequency",members:"8.2K members",count:8200,category:"Campus",desc:"Campus culture, student creators and what's happening next.",letter:"C",tone:"violet"},
  {name:"Lagos After Dark",members:"9.6K members",count:9600,category:"Nightlife",desc:"The people, places and sounds behind the city's nights.",letter:"L",tone:"pink"}
];
const filters=["All","Music","Nightlife","Fashion","Campus"];

export default function DiscoverPage(){
  const [filter,setFilter]=useState("All");
  const [query,setQuery]=useState("");
  const [joined,setJoined]=useState<string[]>([]);
  const visible=useMemo(()=>scenes.filter(s=>(filter==="All"||s.category===filter)&&(!query.trim()||[s.name,s.desc,s.category].join(" ").toLowerCase().includes(query.toLowerCase()))),[filter,query]);
  function toggleJoin(name:string){setJoined(current=>current.includes(name)?current.filter(x=>x!==name):[...current,name]);}
  return <main className="feed-shell">
    <header className="screen-heading"><h1>Discover Scenes</h1><p>Find your people. Find your next scene.</p></header>
    <label className="sr-only" htmlFor="scene-search">Search scenes</label>
    <input id="scene-search" className="club-input" value={query} onChange={e=>setQuery(e.target.value)} placeholder="⌕  Search scenes, people, music..."/>
    <div className="feed-tabs discover-filters">{filters.map(x=><button className={filter===x?"selected":""} onClick={()=>setFilter(x)} key={x}>{x}</button>)}</div>
    <div className="queue-heading"><h2>{filter==="All"?"Popular Scenes":filter+" Scenes"}</h2><span className="selection-hint">{visible.length} found</span></div>
    <div className="scene-list">{visible.map(s=><article className="scene-card" key={s.name}><div className={"scene-art "+s.tone}>{s.letter}</div><div className="scene-info"><strong>{s.name}</strong><small>{s.members}</small><p>{s.desc}</p></div><button className={joined.includes(s.name)?"scene-join joined":"scene-join"} onClick={()=>toggleJoin(s.name)}>{joined.includes(s.name)?"Joined":"Join"}</button></article>)}</div>
    {visible.length===0&&<div className="empty-state"><strong>No Scenes found</strong><p>Try another search or category.</p><button onClick={()=>{setQuery("");setFilter("All");}}>Clear filters</button></div>}
    <p className="selection-hint">Joining is a local preview only; membership is not saved yet.</p>
    <ClubNav active="Discover"/>
  </main>;
}
function ClubNav({active}:{active:string}){return <nav className="bottom-nav"><Link href="/club">⌂<small>Home</small></Link><Link className={active==="Discover"?"active":""} href="/discover">◉<small>Discover</small></Link><Link className="create-button" href="/club/create">＋</Link><Link href="/chats">▢<small>Chats</small></Link><Link href="/my-club">♙<small>My Club</small></Link></nav>}
