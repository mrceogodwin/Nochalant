"use client";
import Link from "next/link";
import {useEffect,useState} from "react";

type FeedPost={id:string;kind:"POST"|"SCENE"|"POLL";body:string;options?:unknown;createdAt:string;author:{username:string;displayName:string;profile?:{avatarUrl?:string|null}|null}};
const stories=[{name:"Afterhours",tone:"pink"},{name:"Alté Society",tone:"violet"},{name:"Sound District",tone:"silver"},{name:"The Drip",tone:"orange"}];

export default function ClubHome(){
 const [tab,setTab]=useState("For You");
 const [posts,setPosts]=useState<FeedPost[]>([]);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState("");
 useEffect(()=>{let active=true;fetch("/api/club/posts").then(async response=>{if(!response.ok)throw new Error("The Club feed is temporarily unavailable.");const result=await response.json();if(active)setPosts(Array.isArray(result.posts)?result.posts:[]);}).catch(reason=>{if(active)setError(reason instanceof Error?reason.message:"Could not load the Club feed.");}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};},[]);
 const visible=tab==="Music"?posts.filter(post=>post.kind==="POLL"):posts;
 return <main className="feed-shell">
  <header className="feed-header"><Link href="/" className="feed-brand">Nochalant<small>CLUB</small></Link><div className="feed-actions"><Link href="/discover" aria-label="Search">⌕</Link><Link href="/notifications" aria-label="Notifications">♧</Link></div></header>
  <section className="stories-row" aria-label="Club stories"><Link href="/club/create" className="story-item"><span className="story-avatar add-story">＋</span><small>Your Story</small></Link>{stories.map(story=><div className="story-item" key={story.name}><span className={"story-avatar "+story.tone}><b>{story.name.slice(0,1)}</b></span><small>{story.name}</small></div>)}</section>
  <nav className="feed-tabs">{["For You","Following","Scenes","Music"].map(value=><button key={value} onClick={()=>setTab(value)} className={tab===value?"selected":""}>{value}</button>)}</nav>
  <Link href="/listening-room" className="music-entry"><span>♫</span><div><strong>The Listening Room</strong><small>Discover new sounds and support emerging artists</small></div><b>→</b></Link>
  <div className="feed-create-prompt"><span className="author-avatar">N</span><Link href="/club/create">What’s happening with you?</Link><Link href="/club/create" className="prompt-plus">＋</Link></div>
  {loading&&<div className="empty-state"><strong>Loading the Club…</strong></div>}
  {error&&<div className="feed-notice" role="alert">{error}<button onClick={()=>{setError("");setLoading(true);fetch("/api/club/posts").then(r=>r.json()).then(r=>setPosts(r.posts||[])).catch(()=>setError("Feed is still unavailable.")).finally(()=>setLoading(false));}}>Retry</button></div>}
  {!loading&&!error&&visible.map(post=><article className="post-card" key={post.id}>
   <header className="post-author"><span className="author-avatar">{(post.author?.displayName||"N").slice(0,1)}</span><div><strong>{post.author?.displayName||"Club member"}</strong><small>@{post.author?.username||"member"} · {new Date(post.createdAt).toLocaleString()}</small></div></header>
   <p className="post-copy">{post.body}</p>
   {post.kind==="POLL"&&<div className="poll-options">{(Array.isArray(post.options)?post.options:[]).map((option,index)=><div key={index}><span>{String(option)}</span></div>)}</div>}
   <footer className="post-actions"><span>{post.kind==="POLL"?"Poll":"Club post"}</span><span>· Published</span></footer>
  </article>)}
  {!loading&&!error&&visible.length===0&&<div className="empty-state"><strong>No posts yet</strong><p>Be the first to share something with the Club.</p><Link href="/club/create">Create a post →</Link></div>}
  <p className="selection-hint feed-preview-note">Published posts are loaded from Nochalant&apos;s database. Likes, comments, story uploads and poll voting are being connected separately.</p>
  <nav className="bottom-nav"><Link className="active" href="/club"><span>⌂</span>Home</Link><Link href="/discover"><span>◉</span>Discover</Link><Link className="create-button" href="/club/create"><span>＋</span></Link><Link href="/chats"><span>▢</span>Chats</Link><Link href="/my-club"><span>♙</span>My Club</Link></nav>
 </main>;
}
