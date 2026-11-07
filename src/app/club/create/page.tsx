"use client";
import Link from "next/link";
import {useState} from "react";\nimport NochalantKeyboard from "@/components/NochalantKeyboard";
export default function CreatePost(){
 const [text,setText]=useState("");const [kind,setKind]=useState("Post");const [options,setOptions]=useState(["",""]);const [scene,setScene]=useState("Everyone");const [submitted,setSubmitted]=useState(false);
 const valid=kind!=="Poll"?text.trim().length>0:text.trim().length>0&&options.filter(x=>x.trim()).length>=2;
 return <main className="onboard-shell"><header className="chat-header"><Link href="/club">‹</Link><div><strong>Create in the Club</strong><small>Share something with your people</small></div></header><div className="onboard-content">
 <p className="onboard-kicker">MAKE SOME NOISE</p><h1>What’s happening<br/><em>with you?</em></h1>
 <div className="feed-tabs">{["Post","Scene","Poll"].map(x=><button className={kind===x?"selected":""} onClick={()=>setKind(x)} key={x}>{x}</button>)}</div>
 <label className="field-label" htmlFor="post-body">{kind==="Poll"?"Ask your question":"Your message"}</label>
 <NochalantKeyboard value={text} onChange={setText} placeholder={kind==="Poll"?"What do you want the Club to decide?":"Share a moment, thought or recommendation..."} multiline/>
 {kind==="Poll"&&<div className="poll-builder"><span className="field-label">Poll options</span>{options.map((v,i)=><input className="club-input" key={i} value={v} onChange={e=>setOptions(current=>current.map((x,j)=>j===i?e.target.value:x))} placeholder={"Option "+(i+1)} maxLength={80}/>)}{options.length<4&&<button className="add-option" onClick={()=>setOptions(current=>[...current,""])}>＋ Add option</button>}</div>}
 <label className="field-label" htmlFor="post-audience">Share with</label><select id="post-audience" className="club-input" value={scene} onChange={e=>setScene(e.target.value)}><option>Everyone</option><option>Following</option><option>My Scenes</option></select>
 <div className="create-attach"><button type="button" onClick={()=>setSubmitted(true)}>＋ Add photo or video</button><button type="button" onClick={()=>setSubmitted(true)}>♫ Add music</button></div>
 {submitted&&<div className="owner-notice"><strong>Media uploads are not connected</strong><p>Photo, video and music attachment support will be enabled with secure storage integration.</p></div>}
 <div className="owner-notice"><strong>Preview mode</strong><p>This composer validates your post locally. Publishing will be enabled after authentication, moderation checks and database persistence are connected.</p></div>
 <button className="yellow-cta" disabled={!valid} onClick={()=>setSubmitted(true)}>Preview {kind} <span>→</span></button>
 {submitted&&<p className="selection-hint">Your {kind.toLowerCase()} is ready for preview, but has not been published or saved.</p>}
 <Link href="/club" className="text-back">Cancel</Link>
 </div></main>;
}
