"use client";
import Link from "next/link";
import {useEffect,useState} from "react";

type FeedPost={id:string;kind:"POST"|"SCENE"|"POLL";body:string;options?:unknown;createdAt:string;author:{username:string;displayName:string;profile?:{avatarUrl?:string|null}|null}};
type Comment={id:string;body:string;createdAt:string;author:{username:string;displayName:string}};
type Engagement={likeCount:number;commentCount:number;voteCounts:{option:string;count:number}[];liked:boolean;myVote:string|null;comments:Comment[]};
const stories=[{name:"Afterhours",tone:"pink"},{name:"Alté Society",tone:"violet"},{name:"Sound District",tone:"silver"},{name:"The Drip",tone:"orange"}];

export default function ClubHome(){
 const [tab,setTab]=useState("For You");
 const [posts,setPosts]=useState<FeedPost[]>([]);
 const [engagement,setEngagement]=useState<Record<string,Engagement>>({});
 const [commentDrafts,setCommentDrafts]=useState<Record<string,string>>({});
 const [busy,setBusy]=useState<Record<string,boolean>>({});
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState("");
 useEffect(()=>{let active=true;fetch("/api/club/posts").then(async response=>{if(!response.ok)throw new Error("The Club feed is temporarily unavailable.");const result=await response.json();if(active)setPosts(Array.isArray(result.posts)?result.posts:[]);}).catch(reason=>{if(active)setError(reason instanceof Error?reason.message:"Could not load the Club feed.");}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};},[]);
 useEffect(()=>{let active=true;posts.forEach(post=>{if(!engagement[post.id])fetch("/api/club/posts/"+post.id+"/engagement").then(r=>r.ok?r.json():null).then(data=>{if(active&&data)setEngagement(current=>({...current,[post.id]:data}));}).catch(()=>{});});return()=>{active=false;};},[posts,engagement]);
 const act=async(postId:string,payload:Record<string,string>)=>{
  setBusy(current=>({...current,[postId]:true}));
  try{const response=await fetch("/api/club/posts/"+postId+"/engagement",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});const data=await response.json();if(!response.ok)throw new Error(data.error||"Could not complete that action.");
   setEngagement(current=>({...current,[postId]:{...(current[postId]||{likeCount:0,commentCount:0,voteCounts:[],liked:false,myVote:null,comments:[]}),...data,comments:data.comment?[...(current[postId]?.comments||[]),data.comment]:current[postId]?.comments||[]}}));
   if(payload.action==="COMMENT")setCommentDrafts(current=>({...current,[postId]:""}));
  }catch(reason){setError(reason instanceof Error?reason.message:"Please sign in and try again.");}finally{setBusy(current=>({...current,[postId]:false}));}
 };
 const visible=tab==="Music"?posts.filter(post=>post.kind==="POLL"):tab==="Following"?posts.filter(post=>post.author.username!==""):posts;
 return <main className="feed-shell">
  <header className="feed-header"><Link href="/" className="feed-brand">Nochalant<small>CLUB</small></Link><div className="feed-actions"><Link href="/discover" aria-label="Search">⌕</Link><Link href="/notifications" aria-label="Notifications">♧</Link></div></header>
  <section className="stories-row" aria-label="Club stories"><Link href="/club/create" className="story-item"><span className="story-avatar add-story">＋</span><small>Your Story</small></Link>{stories.map(story=><div className="story-item" key={story.name}><span className={"story-avatar "+story.tone}><b>{story.name.slice(0,1)}</b></span><small>{story.name}</small></div>)}</section>
  <nav className="feed-tabs">{["For You","Following","Scenes","Music"].map(value=><button key={value} onClick={()=>setTab(value)} className={tab===value?"selected":""}>{value}</button>)}</nav>
  <Link href="/listening-room" className="music-entry"><span>♫</span><div><strong>The Listening Room</strong><small>Discover new sounds and support emerging artists</small></div><b>→</b></Link>
  <div className="feed-create-prompt"><span className="author-avatar">N</span><Link href="/club/create">What’s happening with you?</Link><Link href="/club/create" className="prompt-plus">＋</Link></div>
  {loading&&<div className="empty-state"><strong>Loading the Club…</strong></div>}
  {error&&<div className="feed-notice" role="alert">{error}<button onClick={()=>{setError("");setLoading(true);fetch("/api/club/posts").then(r=>r.json()).then(r=>setPosts(r.posts||[])).catch(()=>setError("Feed is still unavailable.")).finally(()=>setLoading(false));}}>Retry</button></div>}
  {!loading&&!error&&visible.map(post=>{const state=engagement[post.id];return <article className="post-card" key={post.id}>
   <header className="post-author"><span className="author-avatar">{(post.author?.displayName||"N").slice(0,1)}</span><div><strong>{post.author?.displayName||"Club member"}</strong><small>@{post.author?.username||"member"} · {new Date(post.createdAt).toLocaleString()}</small></div></header>
   <p className="post-copy">{post.body}</p>
   {post.kind==="POLL"&&<div className="poll-options">{(Array.isArray(post.options)?post.options:[]).map((option,index)=>{const label=String(option);const count=state?.voteCounts?.find(item=>item.option===label)?.count||0;return <button type="button" key={index} disabled={busy[post.id]} onClick={()=>act(post.id,{action:"VOTE",option:label})} aria-pressed={state?.myVote===label}><span>{label}</span><small>{count} votes{state?.myVote===label?" · Your vote":""}</small></button>;})}</div>}
   <footer className="post-actions"><button type="button" disabled={busy[post.id]} onClick={()=>act(post.id,{action:"LIKE"})}>{state?.liked?"♥ Liked":"♡ Like"} · {state?.likeCount??"—"}</button><span>Comments · {state?.commentCount??"—"}</span></footer>
   <section className="post-comments" aria-label="Comments"><div>{(state?.comments||[]).slice(-3).map(comment=><p key={comment.id}><strong>{comment.author.displayName}</strong> {comment.body}</p>)}</div><form onSubmit={event=>{event.preventDefault();const body=commentDrafts[post.id]?.trim();if(body)act(post.id,{action:"COMMENT",body});}}><input aria-label="Write a comment" placeholder="Add a comment…" value={commentDrafts[post.id]||""} onChange={event=>setCommentDrafts(current=>({...current,[post.id]:event.target.value}))}/><button type="submit" disabled={busy[post.id]||!commentDrafts[post.id]?.trim()}>Send</button></form></section>
  </article>;})}
  {!loading&&!error&&visible.length===0&&<div className="empty-state"><strong>No posts yet</strong><p>Be the first to share something with the Club.</p><Link href="/club/create">Create a post →</Link></div>}
  <p className="selection-hint feed-preview-note">Likes, comments and poll votes are saved to the Club database. Stories and media uploads are still in development.</p>
  <nav className="bottom-nav"><Link className="active" href="/club"><span>⌂</span>Home</Link><Link href="/discover"><span>◉</span>Discover</Link><Link className="create-button" href="/club/create"><span>＋</span></Link><Link href="/chats"><span>▢</span>Chats</Link><Link href="/my-club"><span>♙</span>My Club</Link></nav>
 </main>;
}
