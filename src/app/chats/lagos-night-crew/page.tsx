"use client";
import Link from "next/link";
import {useState} from "react";
type Msg={id:number;name:string;body:string;time:string;mine?:boolean;reaction?:string;reply?:string};
const people=[["Tayo A.","Founder · Admin","T"],["Mira A.","Moderator","M"],["Jude K.","Member","J"],["Nia O.","Member","N"],["You","Member","Y"]];
const starter:Msg[]=[
{id:1,name:"Tayo A.",body:"Who’s pulling up to ILÉ tonight? 👀",time:"8:12 PM"},
{id:2,name:"You",body:"I’m in! 🔥",time:"8:16 PM",mine:true},
{id:3,name:"Mira A.",body:"Table is confirmed for 10. Pull up early!",time:"8:18 PM",reaction:"🔥 3"},
{id:4,name:"Jude K.",body:"See you all there. Drip mandatory! 😎",time:"8:20 PM"}
];
export default function GroupChatPage(){
 const [tab,setTab]=useState("Chat");const [message,setMessage]=useState("");const [messages,setMessages]=useState(starter);const [reply,setReply]=useState<Msg|null>(null);const [notice,setNotice]=useState("");
 function send(e:React.FormEvent){e.preventDefault();if(!message.trim())return;setMessages(v=>[...v,{id:Date.now(),name:"You",body:message.trim(),time:"now",mine:true,reply:reply?.body}]);setMessage("");setReply(null);}
 return <main className="feed-shell chat-screen group-chat-screen">
 <header className="chat-header"><Link href="/chats">‹</Link><span className="chat-avatar">🔥</span><div><strong>Lagos Night Crew</strong><small>Squad · 28 members · 6 online</small></div><Link href="/chats/lagos-night-crew/info" className="group-more">•••</Link></header>
 <div className="chat-room-tabs">{["Chat","Voice Room","Members"].map(t=><button key={t} className={tab===t?"selected":""} onClick={()=>setTab(t)}>{t==="Voice Room"?"♫ Voice Room (3)":t}</button>)}</div>
 {tab==="Chat"&&<><button className="pinned-note" onClick={()=>setNotice("Pinned event details: ILÉ tonight. Meet at 9 PM. Exact venue details are shared by the host privately.")}>⚑ &nbsp; Pinned message <small>Weekend plan: ILÉ tonight! Tap to view event.</small></button>
 <div className="chat-messages group-messages"><div className="chat-day-divider">TODAY · 8:12 PM</div>{messages.map(m=><article className={m.mine?"group-message mine":"group-message"} key={m.id}>{!m.mine&&<span className="group-message-avatar">{m.name.slice(0,1)}</span>}<div className="group-message-content"><small>{m.name} · {m.time}</small>{m.reply&&<blockquote>↳ {m.reply}</blockquote>}<p>{m.body}</p><div className="group-message-tools"><button onClick={()=>setMessages(v=>v.map(x=>x.id===m.id?{...x,reaction:x.reaction?"":"❤️ 1"}:x))}>{m.reaction||"♡ React"}</button><button onClick={()=>setReply(m)}>Reply</button></div></div></article>)}</div>
 {reply&&<div className="replying-to"><span>Replying to <b>{reply.name}</b>: {reply.body}</span><button onClick={()=>setReply(null)}>×</button></div>}
 <form className="chat-compose" onSubmit={send}><button type="button" onClick={()=>setNotice("Photo, video and voice-note attachments will be enabled with secure media storage.")}>＋</button><input value={message} onChange={e=>setMessage(e.target.value)} placeholder="Message the Squad..." maxLength={5000}/><button type="submit" disabled={!message.trim()}>➤</button></form>
 </>}
 {tab==="Voice Room"&&<section className="group-voice-panel"><div className="voice-live-orb">♫</div><p className="onboard-kicker">SQUAD VOICE ROOM</p><h2>Night crew hangout</h2><p>3 people are in the room preview.</p><div className="voice-avatars">{["T","M","J"].map(x=><span key={x}>{x}</span>)}</div><button onClick={()=>setNotice("Voice room preview only. No microphone is activated.")}>Join voice room</button><small>Live audio is not connected yet.</small></section>}
 {tab==="Members"&&<section className="group-members-panel"><div className="queue-heading"><h2>Squad members</h2><span>28 MEMBERS</span></div><label className="chat-search">⌕ <input placeholder="Search members" onChange={e=>setNotice(e.target.value?"Member search preview: "+e.target.value:"")}/></label>{people.map(p=><div className="group-member-row" key={p[0]}><span>{p[2]}</span><div><b>{p[0]}</b><small>{p[1]}</small></div>{p[0]==="You"?<i>You</i>:<button onClick={()=>setNotice("Member profile preview. Follow and message actions need sign-in.")}>View</button>}</div>)}</section>}
 {notice&&<div className="feed-notice">{notice}<button onClick={()=>setNotice("")}>×</button></div>}
 <p className="selection-hint group-preview-note">Group chat preview only. Messages, replies, reactions and member actions are not persisted or delivered.</p>
 <nav className="bottom-nav"><Link href="/club"><span>⌂</span>Home</Link><Link href="/discover"><span>◉</span>Discover</Link><Link className="create-button" href="/club/create"><span>＋</span></Link><Link className="active" href="/chats"><span>▢</span>Chats</Link><Link href="/my-club"><span>♙</span>My Club</Link></nav>
 </main>;
}
