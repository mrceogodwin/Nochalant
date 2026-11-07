"use client";
import Link from "next/link";
import {useState} from "react";
import NochalantKeyboard from "@/components/NochalantKeyboard";
import { saveOfflineDraft } from "@/lib/offline-drafts";

export default function CreatePost(){
 const [text,setText]=useState("");
 const [kind,setKind]=useState("Post");
 const [options,setOptions]=useState(["",""]);
 const [audience,setAudience]=useState("Everyone");
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [savedOffline,setSavedOffline]=useState(false);
 const [saveError,setSaveError]=useState("");
 const valid=kind!=="Poll"?text.trim().length>0:text.trim().length>0&&options.filter(x=>x.trim()).length>=2&&new Set(options.filter(x=>x.trim()).map(x=>x.trim().toLowerCase())).size===options.filter(x=>x.trim()).length;
 async function publish(){
  if(!valid||busy)return;
  setBusy(true);setError("");
  try{
   const response=await fetch("/api/club/posts",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({
    kind:kind.toUpperCase(),body:text.trim(),options:kind==="Poll"?options.filter(x=>x.trim()):undefined,
    audience:audience==="Everyone"?"EVERYONE":audience==="Following"?"FOLLOWING":"MY_SCENES"
   })});
   const result=await response.json();
   if(!response.ok){setError(result.error||"Your post could not be published.");return;}
   window.location.assign("/club?published=1");
  }catch{setError("Connection problem. Your post was not published. Save it as a draft and try again.");}
  finally{setBusy(false);}
 }
 return <main className="onboard-shell"><header className="chat-header"><Link href="/club">‹</Link><div><strong>Create in the Club</strong><small>Share something with your people</small></div></header><div className="onboard-content">
 <p className="onboard-kicker">MAKE SOME NOISE</p><h1>What’s happening<br/><em>with you?</em></h1>
 <div className="feed-tabs">{["Post","Scene","Poll"].map(x=><button type="button" className={kind===x?"selected":""} onClick={()=>setKind(x)} key={x}>{x}</button>)}</div>
 <label className="field-label" htmlFor="post-body">{kind==="Poll"?"Ask your question":"Your message"}</label>
 <NochalantKeyboard value={text} onChange={setText} placeholder={kind==="Poll"?"What do you want the Club to decide?":"Share a moment, thought or recommendation..."} multiline/>
 {kind==="Poll"&&<div className="poll-builder"><span className="field-label">Poll options</span>{options.map((v,i)=><input className="club-input" key={i} value={v} onChange={e=>setOptions(current=>current.map((x,j)=>j===i?e.target.value:x))} placeholder={"Option "+(i+1)} maxLength={80}/>)}{options.length<4&&<button type="button" className="add-option" onClick={()=>setOptions(current=>[...current,""])}>＋ Add option</button>}</div>}
 <label className="field-label" htmlFor="post-audience">Share with</label><select id="post-audience" className="club-input" value={audience} onChange={e=>setAudience(e.target.value)}><option>Everyone</option><option>Following</option><option>My Scenes</option></select>
 <div className="create-attach"><button type="button" onClick={()=>setError("Photo and video publishing will be enabled when secure media storage is connected.")}>＋ Add photo or video</button><button type="button" onClick={()=>setError("Music attachments will be enabled when the media service is connected.")}>♫ Add music</button></div>
 <button type="button" className="yellow-cta" disabled={!valid||busy} onClick={publish}>{busy?"Publishing…":"Publish "+kind}<span>→</span></button>
 {error&&<p role="alert" className="form-error">{error}</p>}
 <button type="button" className="club-secondary" disabled={!text.trim()} onClick={async()=>{try{await saveOfflineDraft({id:crypto.randomUUID(),kind:"post",body:JSON.stringify({text:text.trim(),kind,options:options.filter(x=>x.trim()),audience}),createdAt:Date.now(),syncState:"queued"});setSavedOffline(true);setSaveError("");}catch(error){setSaveError(error instanceof Error?error.message:"Could not save this draft on your device.");}}}>Save draft on this device</button>
 {savedOffline&&<p className="selection-hint">Saved privately on this device. <Link href="/drafts">View offline drafts</Link></p>}{saveError&&<p role="alert" className="selection-hint">{saveError}</p>}
 <p className="selection-hint">Publishing requires a verified, signed-in 18+ member account. Posts are stored in the Club database.</p>
 <Link href="/club" className="text-back">Cancel</Link>
 </div></main>;
}
