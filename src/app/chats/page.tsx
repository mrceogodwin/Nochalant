"use client";
import Link from "next/link";
import {useMemo,useState} from "react";
const chats=[
 {name:"Lagos Night Crew",preview:"Tayo: Who’s pulling up tonight? 🔥",time:"8:16 PM",icon:"🔥",type:"Group",unread:3,href:"/chats/lagos-night-crew",online:true},
 {name:"Mira A.",preview:"Sent you the photos from last night",time:"7:42 PM",icon:"M",type:"Direct",unread:1,href:"/chats/mira",online:true},
 {name:"Alté Society",preview:"Mira: New scene drop is live",time:"Yesterday",icon:"A",type:"Group",unread:0,href:"/chats/lagos-night-crew",online:false},
 {name:"Jude K.",preview:"That demo is sounding crazy 🎧",time:"Yesterday",icon:"J",type:"Direct",unread:0,href:"/chats/jude",online:false},
 {name:"Sound District",preview:"You: I’ll listen tonight",time:"Mon",icon:"♫",type:"Group",unread:0,href:"/chats/lagos-night-crew",online:false}
];
export default function ChatsPage(){
 const [tab,setTab]=useState("All");const [query,setQuery]=useState("");
 const filtered=useMemo(()=>chats.filter(c=>(tab==="All"||(tab==="Unread"?c.unread>0:c.type===tab))&&(c.name+" "+c.preview).toLowerCase().includes(query.toLowerCase())),[tab,query]);
 return <main className="feed-shell inbox-shell"><header className="inbox-top"><div><p className="onboard-kicker">YOUR CORNER</p><h1>Your Chats<span>.</span></h1><p>Keep your people close.</p></div><Link href="/chats/requests" className="inbox-icon-button" aria-label="Message requests">✉<i/></Link></header>
 <div className="chat-shortcuts"><Link href="/chats/voice-rooms"><span>♫</span><b>Voice rooms</b><small>2 live now</small></Link><Link href="/chats/requests"><span>↗</span><b>Requests</b><small>2 waiting</small></Link></div>
 <label className="chat-search">⌕ <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search conversations"/></label>
 <div className="chat-tabs">{["All","Unread","Direct","Group"].map(t=><button key={t} className={tab===t?"selected":""} onClick={()=>setTab(t)}>{t}</button>)}</div>
 <div className="inbox-list">{filtered.map(c=><Link href={c.href} className="chat-row" key={c.name}><span className="chat-avatar">{c.icon}{c.online&&<i/>}</span><span className="chat-copy"><strong>{c.name}</strong><small>{c.preview}</small></span><span className="chat-meta"><time>{c.time}</time>{c.unread>0&&<b>{c.unread}</b>}</span></Link>)}{!filtered.length&&<div className="empty-state"><strong>No conversations found</strong><p>Try another name or filter.</p></div>}</div>
 <p className="selection-hint inbox-note">Sample conversations for the V2 interface. Messaging is not connected to live accounts yet.</p>
 <nav className="bottom-nav"><Link href="/club"><span>⌂</span>Home</Link><Link href="/discover"><span>◉</span>Discover</Link><Link className="create-button" href="/club/create"><span>＋</span></Link><Link className="active" href="/chats"><span>▢</span>Chats</Link><Link href="/my-club"><span>♙</span>My Club</Link></nav></main>
}
