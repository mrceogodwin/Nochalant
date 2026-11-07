"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Post = { id:string; author:string; handle:string; time:string; city:string; body:string; kind:"Post"|"Poll"; options?:string[]; votes?:number[]; comments:string[]; liked:boolean; saved:boolean; };
const initialPosts:Post[]=[
 {id:"p1",author:"Afterhours",handle:"@afterhours",time:"2h ago",city:"Lagos",body:"Best club in Lagos right now? 👀",kind:"Post",comments:["The new spot in VI is a vibe.","Depends on the music tonight."],liked:false,saved:false},
 {id:"p2",author:"Alté Society",handle:"@altesociety",time:"4h ago",city:"Scene update",body:"The weekend is calling. Who’s outside? ✨",kind:"Post",comments:["Always outside 🔥"],liked:false,saved:false},
 {id:"p3",author:"Sound District",handle:"@sounddistrict",time:"Yesterday",city:"Music",body:"Which sound should get more attention this year?",kind:"Poll",options:["Alté / alternative","Afrobeats","Electronic / Amapiano"],votes:[42,87,31],comments:[],liked:false,saved:false}
];
const stories=[{name:"Afterhours",tone:"pink"},{name:"Alté Society",tone:"violet"},{name:"Sound District",tone:"silver"},{name:"The Drip",tone:"orange"}];

export default function ClubHome(){
 const [tab,setTab]=useState("For You");
 const [posts,setPosts]=useState(initialPosts);
 const [commentFor,setCommentFor]=useState<string|null>(null);
 const [commentText,setCommentText]=useState("");
 const [notice,setNotice]=useState("");
 const visible=useMemo(()=>posts.filter(p=>tab==="Following"?false:tab==="Scenes"?false:tab==="Music"?p.kind==="Poll":true),[posts,tab]);
 function update(id:string,patch:Partial<Post>){setPosts(current=>current.map(p=>p.id===id?{...p,...patch}:p));}
 function vote(post:Post,index:number){if(!post.votes)return;const next=[...post.votes];next[index]+=1;update(post.id,{votes:next});setNotice("Vote recording is not enabled yet.");}
 function addComment(id:string){if(!commentText.trim())return;const post=posts.find(p=>p.id===id);if(!post)return;update(id,{comments:[...post.comments,commentText.trim()]});setCommentText("");setNotice("Comment added to this local preview.");}
 return <main className="feed-shell">
  <header className="feed-header"><Link href="/" className="feed-brand">Nochalant<small>CLUB</small></Link><div className="feed-actions"><Link href="/discover" aria-label="Search">⌕</Link><Link href="/notifications" aria-label="Notifications">♧</Link></div></header>
  <section className="stories-row" aria-label="Club stories"><button className="story-item" onClick={()=>setNotice("Story creation will be enabled with media uploads.")}><span className="story-avatar add-story">＋</span><small>Your Story</small></button>{stories.map(s=><button className="story-item" key={s.name} onClick={()=>setNotice(s.name+" stories are a preview.")}><span className={"story-avatar "+s.tone}><b>{s.name.slice(0,1)}</b></span><small>{s.name}</small></button>)}</section>
  <nav className="feed-tabs">{["For You","Following","Scenes","Music"].map(t=><button key={t} onClick={()=>setTab(t)} className={tab===t?"selected":""}>{t}</button>)}</nav>
  <Link href="/listening-room" className="music-entry"><span>♫</span><div><strong>The Listening Room</strong><small>Discover new sounds and support emerging artists</small></div><b>→</b></Link>
  <div className="feed-create-prompt"><span className="author-avatar">N</span><Link href="/club/create">What’s happening with you?</Link><Link href="/club/create" className="prompt-plus">＋</Link></div>
  {notice&&<div className="feed-notice" role="status">{notice}<button onClick={()=>setNotice("")}>×</button></div>}
  {loading&&<div className="empty-state"><strong>Loading the Club…</strong></div>}\n  {!loading&&visible.map(post=><article className="post-card" key={post.id}>
   <header className="post-author"><span className="author-avatar">{post.author.slice(0,1)}</span><div><strong>{post.author} <b className="verified">✓</b></strong><small>{post.handle} · {post.time} · {post.city}</small></div><button className="more-button" aria-label="More options" onClick={()=>setNotice("Post reporting and moderation options will be available after sign-in.")}>•••</button></header>
   <p className="post-copy">{post.body}</p>
   {post.id==="p1"&&<div className="post-art"><span>LAGOS</span><strong>AFTERHOURS</strong><small>THE CITY NEVER SLEEPS</small></div>}
   {post.kind==="Poll"&&<div className="poll-options">{post.options?.map((option,i)=><button key={option} onClick={()=>vote(post,i)}><span>{option}</span><b>{post.votes?.[i]}</b></button>)}</div>}
   <footer className="post-actions"><button onClick={()=>update(post.id,{liked:!post.liked})} className={post.liked?"liked":""}>♡ <span>{post.liked?"Liked":"Like"}</span></button><button onClick={()=>setCommentFor(commentFor===post.id?null:post.id)}>▢ <span>{post.comments.length} comments</span></button><button onClick={()=>setNotice("Sharing will be available when public post links are enabled.")}>↗</button><button className={post.saved?"save-post liked":"save-post"} onClick={()=>update(post.id,{saved:!post.saved})}>{post.saved?"Saved":"♧"}</button></footer>
   {commentFor===post.id&&<div className="comment-panel"><div className="comment-list">{post.comments.map((comment,i)=><p key={i}><b>Club member</b>{comment}</p>)}</div><form onSubmit={e=>{e.preventDefault();addComment(post.id);}}><input value={commentText} onChange={e=>setCommentText(e.target.value)} placeholder="Write a comment..." maxLength={500}/><button disabled={!commentText.trim()}>Send</button></form></div>}
  </article>)}
  {!loading&&visible.length===0&&<div className="empty-state"><strong>No posts yet</strong><p>Be the first to share something with the Club.</p><Link href="/club/create">Create a post →</Link></div>}
  <p className="selection-hint feed-preview-note">Club posts are loaded from the Nochalant database. Likes, comments and poll voting are being connected separately.</p>
  <nav className="bottom-nav"><Link className="active" href="/club"><span>⌂</span>Home</Link><Link href="/discover"><span>◉</span>Discover</Link><Link className="create-button" href="/club/create"><span>＋</span></Link><Link href="/chats"><span>▢</span>Chats</Link><Link href="/my-club"><span>♙</span>My Club</Link></nav>
 </main>;
}
