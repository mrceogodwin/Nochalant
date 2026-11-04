import React,{useCallback,useEffect,useState} from "react";
import {getAuthToken} from "./auth.js";

const blankProfile={publicationName:"",outletType:"digital_publication",bio:"",websiteUrl:"",contactEmail:"",location:"",beats:[]};
const beatOptions=["Entertainment","Music","Nollywood","Lifestyle","Business","Technology","Politics","Sports","Events","Fashion","Street Culture","Culture"];
const categories=["Entertainment","Music","Nollywood","Lifestyle","Business","Technology","Politics","Sports","Events","Fashion","Street Culture"];

export default function MediaWorkspace(){
 const [profile,setProfile]=useState(blankProfile),[pitches,setPitches]=useState([]),[busy,setBusy]=useState(false),[error,setError]=useState(""),[notice,setNotice]=useState("");
 const [pitch,setPitch]=useState({title:"",category:"Entertainment",summary:"",sourceUrl:""});
 const call=useCallback(async(body)=>{const token=await getAuthToken();if(!token)throw new Error("Your session expired. Please sign in again.");const response=await fetch("/api/media/workspace",{method:body?"POST":"GET",headers:{"Authorization":"Bearer "+token,...(body?{"Content-Type":"application/json"}:{})},...(body?{body:JSON.stringify(body)}:{}),cache:"no-store"});const data=await response.json().catch(()=>({}));if(!response.ok||!data.ok)throw new Error(data.error||"Media workspace request failed.");return data;},[]);
 const load=useCallback(async()=>{setBusy(true);setError("");try{const data=await call();if(data.profile)setProfile({...blankProfile,...data.profile,publicationName:data.profile.publication_name||"",outletType:data.profile.outlet_type||"digital_publication",websiteUrl:data.profile.website_url||"",contactEmail:data.profile.contact_email||"",beats:data.profile.beats||[]});setPitches(data.pitches||[]);}catch(e){setError(e.message);}finally{setBusy(false);}},[call]);
 useEffect(()=>{load();},[load]);
 const change=e=>setProfile(v=>({...v,[e.target.name]:e.target.value}));
 const toggleBeat=value=>setProfile(v=>({...v,beats:v.beats.includes(value)?v.beats.filter(x=>x!==value):[...v.beats,value].slice(0,8)}));
 const save=async e=>{e.preventDefault();setBusy(true);setError("");setNotice("");try{const data=await call({action:"save_profile",...profile});setProfile({...blankProfile,...data.profile,publicationName:data.profile.publication_name||"",outletType:data.profile.outlet_type||"digital_publication",websiteUrl:data.profile.website_url||"",contactEmail:data.profile.contact_email||"",beats:data.profile.beats||[]});setNotice("Publisher profile saved.");}catch(err){setError(err.message);}finally{setBusy(false);}};
 const submit=async e=>{e.preventDefault();setBusy(true);setError("");setNotice("");try{await call({action:"submit_pitch",...pitch});setPitch({title:"",category:"Entertainment",summary:"",sourceUrl:""});setNotice("Your pitch has been sent to the editorial desk.");await load();}catch(err){setError(err.message);}finally{setBusy(false);}};
 const statusLabel=status=>({pending:"Pending editorial review",in_review:"In review",accepted:"Accepted",rejected:"Not accepted"}[status]||status);
 return <section className="artist-studio-tools media-workspace">
  <div className="artist-studio-heading"><div><span className="eyebrow">MEDIA & PUBLISHER WORKSPACE</span><h2>Bring your <em>coverage.</em></h2><p>Manage your publication identity and send story pitches directly to the Nochalant editorial desk.</p></div></div>
  {error&&<p className="artist-studio-error" role="alert">{error}</p>}{notice&&<p className="fine-print" role="status">{notice}</p>}
  <form className="artist-studio-form" onSubmit={save}><h3>Publication profile</h3>
   <label>Publication / media brand<input name="publicationName" value={profile.publicationName} onChange={change} required minLength="2" maxLength="160" placeholder="Your outlet name"/></label>
   <label>Outlet type<select name="outletType" value={profile.outletType} onChange={change}>{[["digital_publication","Digital publication"],["blog","Blog"],["radio","Radio"],["television","Television"],["print","Print"],["podcast","Podcast"],["other","Other"]].map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label>
   <label>About your publication<textarea name="bio" value={profile.bio} onChange={change} rows="4" maxLength="3000" placeholder="What does your outlet cover?"/></label>
   <div className="artist-studio-form-grid"><label>Website (HTTPS)<input name="websiteUrl" type="url" value={profile.websiteUrl} onChange={change} placeholder="https://"/></label><label>Editorial contact email<input name="contactEmail" type="email" value={profile.contactEmail} onChange={change}/></label><label>Location<input name="location" value={profile.location} onChange={change} maxLength="140" placeholder="City, country"/></label></div>
   <fieldset className="media-beats"><legend>Coverage beats (up to 8)</legend><div className="media-beats-grid">{beatOptions.map(beat=><label key={beat}><input type="checkbox" checked={profile.beats.includes(beat)} onChange={()=>toggleBeat(beat)}/>{beat}</label>)}</div></fieldset>
   <button className="button button-green" disabled={busy}>{busy?"Saving…":"Save publication profile"}</button>
  </form>
  <div className="artist-studio-heading"><div><span className="eyebrow">EDITORIAL RELATIONSHIP</span><h2>Submit a <em>story pitch.</em></h2><p>Pitches enter the editorial queue. Acceptance and publication remain subject to editorial review.</p></div></div>
  <form className="artist-studio-form" onSubmit={submit}>
   <label>Pitch headline<input value={pitch.title} onChange={e=>setPitch(v=>({...v,title:e.target.value}))} minLength="8" maxLength="180" required placeholder="What is the story?"/></label>
   <label>Category<select value={pitch.category} onChange={e=>setPitch(v=>({...v,category:e.target.value}))}>{categories.map(x=><option key={x}>{x}</option>)}</select></label>
   <label>Pitch summary<textarea value={pitch.summary} onChange={e=>setPitch(v=>({...v,summary:e.target.value}))} minLength="30" maxLength="5000" rows="5" required placeholder="Share the key facts, context, people involved and why the story matters."/></label>
   <label>Source / reference URL (HTTPS)<input type="url" value={pitch.sourceUrl} onChange={e=>setPitch(v=>({...v,sourceUrl:e.target.value}))} placeholder="https://"/></label>
   <button className="button button-green" disabled={busy||!profile.publicationName.trim()}>{busy?"Submitting…":"Send story pitch"}</button>
  </form>
  <div className="artist-studio-heading"><div><span className="eyebrow">YOUR SUBMISSIONS</span><h2>Pitch <em>history.</em></h2></div><button className="button button-outline" type="button" onClick={load} disabled={busy}>Refresh</button></div>
  {pitches.length?<div className="event-organizer-list">{pitches.map(item=><article className="account-dashboard-card" key={item.id}><span className="dashboard-status">{statusLabel(item.status).toUpperCase()}</span><h3>{item.title}</h3><p>{item.category} · {new Date(item.created_at).toLocaleDateString()}</p><p>{item.summary}</p>{item.editor_note&&<p><strong>Editorial note:</strong> {item.editor_note}</p>}</article>)}</div>:<p className="fine-print">No story pitches yet. Save your publication profile and send your first pitch.</p>}
 </section>;
}
