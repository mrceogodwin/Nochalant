/* eslint react-hooks/set-state-in-effect: off -- Existing client effects coordinate asynchronous data loading or display copy; tracked for targeted refactoring. */
import React,{useEffect,useState} from "react";
import {getAuthToken} from "./auth.js";
export default function EditorialAutoPostAdmin(){
 const [settings,setSettings]=useState({enabled:false,daily_limit:5,last_run_at:null});
 const [sources,setSources]=useState([]),[items,setItems]=useState([]),[busy,setBusy]=useState(false),[error,setError]=useState(""),[notice,setNotice]=useState("");
 const request=async(body)=>{
  const token=await getAuthToken();if(!token)throw new Error("Administrator session expired. Sign in again.");
  const response=await fetch("/api/editorial/auto-post",{method:body?"POST":"GET",headers:{Authorization:`Bearer ${token}`,...(body?{"Content-Type":"application/json"}:{})},...(body?{body:JSON.stringify(body)}:{}),cache:"no-store"});
  const data=await response.json().catch(()=>({}));if(!response.ok||!data.ok)throw new Error(data.error||"Editorial automation request failed.");return data;
 };
 const load=async()=>{setBusy(true);setError("");try{const d=await request();setSettings(d.settings||{enabled:false,daily_limit:5});setSources(d.sources||[]);setItems(d.items||[]);}catch(e){setError(e.message);}finally{setBusy(false);}};
 useEffect(()=>{load();},[]);
 const run=async(body,success)=>{setBusy(true);setError("");setNotice("");try{const d=await request(body);if(body.action==="toggle")setSettings(s=>({...s,enabled:d.enabled}));else if(d.items)setItems(d.items);else await load();setNotice(success(d));}catch(e){setError(e.message);}finally{setBusy(false);}};
 const pending=items.filter(x=>x.status==="pending");
 return <section className="promotion-admin-panel editorial-auto-post-admin">
  <div className="artists-heading"><div><span className="eyebrow">EDITORIAL AUTOMATION · SUPER ADMIN</span><h2>Entertainment <em>auto-post.</em></h2><p>Discover fresh entertainment stories from configured RSS sources. No paid API or AI credits required.</p></div><button className="button button-outline" disabled={busy} onClick={load}>Refresh</button></div>
  <div className="editorial-auto-controls">
   <div><strong>Daily Auto Post</strong><p>{settings.enabled?"ON · Daily collection and publishing are enabled.":"OFF · Nothing will publish automatically."}</p></div>
   <button className={settings.enabled?"button button-green":"button button-outline"} disabled={busy} onClick={()=>run({action:"toggle",enabled:!settings.enabled},d=>d.enabled?"Daily Auto Post enabled.":"Daily Auto Post paused.")}>{busy?"Saving…":settings.enabled?"Turn Auto Post off":"Turn Auto Post on"}</button>
  </div>
  <div className="editorial-auto-actions"><button className="button button-green" disabled={busy} onClick={()=>run({action:"fetch"},d=>`Fetched ${d.discovered||0} new stories from ${d.sourceCount||0} sources.`)}>Fetch Latest</button><span>{pending.length} stories waiting · {sources.filter(s=>s.enabled).length} active sources</span></div>
  <div className="editorial-source-list"><strong>Connected free sources</strong>{sources.map(s=><span key={s.id}>{s.name} · {s.category}</span>)}</div>
  <div className="editorial-discovery-list">{pending.map(item=><article className="editorial-discovery-item" key={item.id}>{item.image_url&&<img src={item.image_url} alt="" loading="lazy"/>}<div><strong>{item.title}</strong><p>{item.summary||"No summary supplied by source."}</p><small>{item.source_name} · {item.category} · <a href={item.source_url} target="_blank" rel="noreferrer">Original source</a></small><div className="editorial-discovery-actions"><button className="button button-green button-small" disabled={busy} onClick={()=>run({action:"publish",itemId:item.id},()=> "Story published to Latest Gist.")}>Publish now</button><button className="button button-outline button-small" disabled={busy} onClick={()=>run({action:"dismiss",itemId:item.id},()=> "Story dismissed.")}>Dismiss</button></div></div></article>)}</div>
  {!pending.length&&<div className="social-feed-state"><strong>No stories waiting.</strong><p>Use Fetch Latest to discover new entertainment coverage.</p></div>}
  {error&&<p className="promotion-message" role="alert">{error}</p>}{notice&&<p className="promotion-message" role="status">{notice}</p>}
  <small className="fine-print">Automatic mode runs once daily at 9:00 AM Nigeria time. Publishing uses source headlines, short feed summaries and original links. Check source rights and editorial accuracy before enabling. Super Admin controls are free; feed availability depends on each publisher.</small>
 </section>;
}
