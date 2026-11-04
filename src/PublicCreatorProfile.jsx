import React,{useEffect,useState} from "react";
import {localDateTimeToIso} from "./event-date-time.js";

export default function PublicCreatorProfile({creatorId}){
  const [data,setData]=useState(null),[loading,setLoading]=useState(true),[error,setError]=useState(""),[busy,setBusy]=useState(false),[notice,setNotice]=useState("");
  useEffect(()=>{
    let active=true;
    fetch("/api/creator/profile?id="+encodeURIComponent(creatorId),{cache:"no-store"})
      .then(async response=>{const result=await response.json().catch(()=>({}));if(!response.ok||!result.ok)throw new Error(result.error||"Creator profile could not be loaded.");return result;})
      .then(result=>{if(active)setData(result);})
      .catch(err=>{if(active)setError(err.message);})
      .finally(()=>{if(active)setLoading(false);});
    return()=>{active=false;};
  },[creatorId]);
  const submit=async event=>{
    event.preventDefault();if(busy)return;
    const formElement=event.currentTarget;
    const form=new FormData(formElement);
    setBusy(true);setError("");setNotice("");
    try{
      const response=await fetch("/api/creator/bookings",{method:"POST",headers:{"Content-Type":"application/json","Accept":"application/json"},body:JSON.stringify({
        creatorId,name:String(form.get("name")||"").trim(),email:String(form.get("email")||"").trim(),
        message:String(form.get("message")||"").trim(),requestedFor:localDateTimeToIso(String(form.get("requestedFor")||"")),
        website:String(form.get("website")||"")
      })});
      const result=await response.json().catch(()=>({}));
      if(!response.ok||!result.ok)throw new Error(result.error||"Your enquiry could not be sent.");
      setNotice(result.message||"Your enquiry has been sent.");
      formElement.reset();
    }catch(err){setError(err.message);}
    finally{setBusy(false);}
  };
  return <main className="public-creator-page container screen-page">
    <a className="public-creator-back" href="/">← Back to Nochalant</a>
    {loading?<p className="account-dashboard-loading" role="status">Loading creator profile…</p>:error&&!data?<div className="account-dashboard-loading" role="alert"><h1>Creator profile unavailable</h1><p>{error}</p></div>:data&&<>
      <header className="public-creator-hero">
        <span className="eyebrow">NOCHALANT CREATOR</span>
        <h1>{data.profile.display_title}</h1>
        <p>{data.profile.creator_category.replaceAll("_"," ")}{data.profile.location?" · "+data.profile.location:""}</p>
        {data.profile.bio&&<div className="public-creator-bio">{data.profile.bio}</div>}
        {data.profile.website_url&&<a href={data.profile.website_url} target="_blank" rel="noreferrer">Visit website ↗</a>}
      </header>
      <section className="public-creator-portfolio">
        <div className="artist-studio-heading"><div><span className="eyebrow">SELECTED WORK</span><h2>Creator <em>portfolio.</em></h2></div></div>
        {data.portfolio.length?<div className="account-dashboard-grid">{data.portfolio.map(item=><article className="account-dashboard-card" key={item.id}>
          <span className="eyebrow">PORTFOLIO</span><h3>{item.title}</h3>{item.description&&<p>{item.description}</p>}
          {item.media_url&&<a href={item.media_url} target="_blank" rel="noreferrer">View media ↗</a>}
          {item.external_url&&<a href={item.external_url} target="_blank" rel="noreferrer">Open project ↗</a>}
        </article>)}</div>:<p className="account-dashboard-loading">This creator has not added portfolio work yet.</p>}
      </section>
      {data.profile.booking_enabled&&<section className="public-creator-booking">
        <div className="artist-studio-heading"><div><span className="eyebrow">WORK WITH THIS CREATOR</span><h2>Send a booking <em>enquiry.</em></h2><p>Your contact details are shared only with this creator for the enquiry.</p></div></div>
        {error&&<p className="artist-studio-error" role="alert">{error}</p>}
        {notice&&<p className="dashboard-status" role="status">{notice}</p>}
        <form className="artist-studio-form" onSubmit={submit}>
          <label>Your name<input name="name" required minLength="2" maxLength="120" autoComplete="name"/></label>
          <label>Email address<input name="email" type="email" required maxLength="254" autoComplete="email"/></label>
          <label>Preferred date and time (optional)<input name="requestedFor" type="datetime-local"/></label>
          <label>Tell the creator about your project<textarea name="message" required minLength="10" maxLength="3000" rows="5" placeholder="What would you like to discuss?"/></label>
          <label className="public-creator-honeypot" aria-hidden="true">Leave this field empty<input name="website" tabIndex="-1" autoComplete="off"/></label>
          <button className="button button-green" disabled={busy}>{busy?"Sending…":"Send booking enquiry"}</button>
        </form>
      </section>}
    </>}
  </main>;
}
