import React, { useCallback, useEffect, useState } from "react";
import { getAuthToken } from "./auth.js";

const blank = { title:"", description:"", showId:"", seasonId:"", seasonNumber:"1", episodeNumber:"1", videoUrl:"", thumbnailUrl:"", durationSeconds:"" };

export default function PodcastAdmin() {
  const [catalogue,setCatalogue] = useState({shows:[],seasons:[],episodes:[],clips:[]});
  const [form,setForm] = useState(blank);
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState("");
  const [notice,setNotice] = useState("");
  const [hostForm,setHostForm] = useState({showId:"",hostName:"",hostRole:"",hostBio:"",hostImageUrl:"",hostInstagramUrl:"",hostTiktokUrl:""});
  const load = useCallback(async () => {
    const token = await getAuthToken();
    if (!token) throw new Error("Your session has expired. Sign in again.");
    const response = await fetch("/api/podcast?admin=1",{headers:{Authorization:`Bearer ${token}`},cache:"no-store"});
    const data = await response.json().catch(()=>({}));
    if (!response.ok || !data.ok) throw new Error(data.error || "Podcast catalogue could not load.");
    setCatalogue(data);
    setHostForm(current=>{const show=data.shows.find(item=>item.id===current.showId)||data.shows[0];return show?{showId:show.id,hostName:show.host_name||"",hostRole:show.host_role||"",hostBio:show.host_bio||"",hostImageUrl:show.host_image_url||"",hostInstagramUrl:show.host_instagram_url||"",hostTiktokUrl:show.host_tiktok_url||""}:current;});
  },[]);
  useEffect(()=>{load().catch(e=>setError(e.message));},[load]);
  const change = e => setForm(current=>({...current,[e.target.name]:e.target.value}));
  const submit = async (event,action) => {
    event.preventDefault(); setBusy(true); setError(""); setNotice("");
    try {
      const token=await getAuthToken();
      const payload={action,...form};
      const response=await fetch("/api/podcast",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},body:JSON.stringify(payload)});
      const data=await response.json().catch(()=>({}));
      if(!response.ok||!data.ok) throw new Error(data.error||"Podcast item could not be saved.");
      setNotice(action.replaceAll("_"," ")+" saved as a draft.");
      setForm(current=>({...blank,showId:current.showId,seasonId:current.seasonId}));
      await load();
    } catch(e){setError(e.message||"Podcast action failed.");}
    finally{setBusy(false);}
  };
  const saveHost = async event => {
    event.preventDefault(); setBusy(true); setError(""); setNotice("");
    try {
      const token=await getAuthToken();
      const response=await fetch("/api/podcast",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},body:JSON.stringify({action:"update_show_host",...hostForm})});
      const data=await response.json().catch(()=>({}));
      if(!response.ok||!data.ok) throw new Error(data.error||"Host profile could not be saved.");
      setNotice("Podcast host profile updated."); await load();
    }catch(e){setError(e.message||"Host profile could not be saved.");}
    finally{setBusy(false);}
  };
  const publish = async (kind,id) => {
    setBusy(true);setError("");setNotice("");
    try {
      const token=await getAuthToken();
      const response=await fetch("/api/podcast",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},body:JSON.stringify({action:"publish_"+kind,id})});
      const data=await response.json().catch(()=>({}));
      if(!response.ok||!data.ok) throw new Error(data.error||"Item could not be published.");
      setNotice(kind+" published."); await load();
    }catch(e){setError(e.message||"Publishing failed.");}
    finally{setBusy(false);}
  };
  const shows=catalogue.shows||[];
  const seasons=catalogue.seasons||[];
  const episodes=catalogue.episodes||[];
  return <section className="podcast-admin">
    <div className="podcast-admin-heading"><div><span className="eyebrow">NOCHALANT STUDIOS · EDITORIAL</span><h2>Podcast <em>Control Desk.</em></h2><p>Create series, seasons and episodes. Drafts stay private until you publish them.</p></div><button type="button" className="button button-outline" onClick={()=>load().catch(e=>setError(e.message))}>Refresh catalogue</button></div>
    {error&&<p className="podcast-admin-error" role="alert">{error}</p>}
    {notice&&<p className="podcast-admin-notice" role="status">{notice}</p>}
    <div className="podcast-admin-stats"><span><b>{shows.length}</b> series</span><span><b>{seasons.length}</b> seasons</span><span><b>{episodes.length}</b> episodes</span><span><b>{(catalogue.clips||[]).length}</b> clips</span></div>
    <form className="podcast-admin-form podcast-host-editor" onSubmit={saveHost}>
      <h3>Podcast host profile</h3><p className="fine-print">This profile appears in the podcast heading on the public site. Changes take effect after saving.</p>
      <label>Series<select value={hostForm.showId} onChange={e=>{const show=shows.find(item=>item.id===e.target.value);setHostForm(show?{showId:show.id,hostName:show.host_name||"",hostRole:show.host_role||"",hostBio:show.host_bio||"",hostImageUrl:show.host_image_url||"",hostInstagramUrl:show.host_instagram_url||"",hostTiktokUrl:show.host_tiktok_url||""}:current=>({...current,showId:e.target.value}));}} required><option value="">Choose a series</option>{shows.map(show=><option key={show.id} value={show.id}>{show.title}</option>)}</select></label>
      <div className="podcast-admin-form-grid">
        <label>Host name<input value={hostForm.hostName} onChange={e=>setHostForm(current=>({...current,hostName:e.target.value}))} maxLength="120" placeholder="Host's display name"/></label>
        <label>Role / title<input value={hostForm.hostRole} onChange={e=>setHostForm(current=>({...current,hostRole:e.target.value}))} maxLength="100" placeholder="e.g. Host & Presenter"/></label>
        <label className="podcast-admin-span">Host photo URL (HTTPS)<input type="url" value={hostForm.hostImageUrl} onChange={e=>setHostForm(current=>({...current,hostImageUrl:e.target.value}))} placeholder="https://…"/></label>
        <label>Instagram URL<input type="url" value={hostForm.hostInstagramUrl} onChange={e=>setHostForm(current=>({...current,hostInstagramUrl:e.target.value}))} placeholder="https://www.instagram.com/hunterofafrica/"/></label>
        <label>TikTok URL<input type="url" value={hostForm.hostTiktokUrl} onChange={e=>setHostForm(current=>({...current,hostTiktokUrl:e.target.value}))} placeholder="https://www.tiktok.com/@hunterofafrica"/></label>
        <label className="podcast-admin-span">Host biography<textarea rows="5" maxLength="1200" value={hostForm.hostBio} onChange={e=>setHostForm(current=>({...current,hostBio:e.target.value}))} placeholder="Professional biography and entertainment background."/></label>
      </div>
      <button className="button button-green" disabled={busy||!hostForm.showId}>Save host profile</button>
    </form>
    <div className="podcast-admin-forms">
      <form className="podcast-admin-form" onSubmit={e=>submit(e,"create_show")}><h3>New series</h3><label>Series title<input name="title" value={form.title} onChange={change} required maxLength="180" placeholder="e.g. Nochalant Sessions"/></label><label>Description<textarea name="description" value={form.description} onChange={change} rows="3" maxLength="4000"/></label><button className="button button-green" disabled={busy}>Save series draft</button></form>
      <form className="podcast-admin-form" onSubmit={e=>submit(e,"create_season")}><h3>New season</h3><label>Series<select name="showId" value={form.showId} onChange={change} required><option value="">Choose a series</option>{shows.map(s=><option key={s.id} value={s.id}>{s.title}</option>)}</select></label><label>Season number<input name="seasonNumber" type="number" min="1" value={form.seasonNumber} onChange={change} required/></label><label>Season title<input name="title" value={form.title} onChange={change} required maxLength="180"/></label><label>Description<textarea name="description" value={form.description} onChange={change} rows="2"/></label><button className="button button-green" disabled={busy||!shows.length}>Save season draft</button></form>
      <form className="podcast-admin-form podcast-admin-form-wide" onSubmit={e=>submit(e,"create_episode")}><h3>New episode</h3><div className="podcast-admin-form-grid"><label>Series<select name="showId" value={form.showId} onChange={change} required><option value="">Choose a series</option>{shows.map(s=><option key={s.id} value={s.id}>{s.title}</option>)}</select></label><label>Season<select name="seasonId" value={form.seasonId} onChange={change}><option value="">No season / standalone</option>{seasons.filter(s=>!form.showId||s.show_id===form.showId).map(s=><option key={s.id} value={s.id}>{s.title}</option>)}</select></label><label>Episode number<input name="episodeNumber" type="number" min="1" value={form.episodeNumber} onChange={change}/></label><label>Episode title<input name="title" value={form.title} onChange={change} required maxLength="180"/></label><label className="podcast-admin-span">Description<textarea name="description" value={form.description} onChange={change} rows="3"/></label><label className="podcast-admin-span">Video URL (HTTPS)<input name="videoUrl" type="url" value={form.videoUrl} onChange={change} placeholder="https://…"/></label><label>Thumbnail URL (HTTPS)<input name="thumbnailUrl" type="url" value={form.thumbnailUrl} onChange={change} placeholder="https://…"/></label><label>Duration (seconds)<input name="durationSeconds" type="number" min="0" value={form.durationSeconds} onChange={change}/></label></div><small className="fine-print">Video URL publishing is enabled. Direct file upload to private Neon Storage is the next integration step; do not use temporary or expiring links.</small><button className="button button-green" disabled={busy||!shows.length}>Save episode draft</button></form>
    </div>
    <div className="podcast-admin-list"><h3>Editorial queue</h3>{episodes.length?episodes.map(ep=><article className="podcast-admin-row" key={ep.id}><div><strong>{ep.title}</strong><small>{shows.find(s=>s.id===ep.show_id)?.title||"Series"} · {ep.status} · {ep.video_url?"Video attached":"No video attached"}</small></div><span className="podcast-admin-status">{ep.status}</span>{ep.status!=="published"&&<button className="button button-outline" disabled={busy||!ep.video_url} onClick={()=>publish("episode",ep.id)}>Publish</button>}</article>):<p className="fine-print">No episodes yet. Create the first episode draft above.</p>}</div>
  </section>;
}
