import React, { useCallback, useEffect, useState } from "react";
import { getAuthToken } from "./auth.js";
import { localDateTimeToIso, toLocalDateTimeInput } from "./event-date-time.js";

const empty = { title:"", description:"", category:"Music", venue:"", city:"", startsAt:"", endsAt:"", ticketUrl:"", imageUrl:"" };
const dateValue = value => toLocalDateTimeInput(value);

export default function EventOrganizerWorkspace() {
  const [events,setEvents] = useState([]);
  const [draft,setDraft] = useState(empty);
  const [editing,setEditing] = useState("");
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState("");
  const [notice,setNotice] = useState("");

  const request = useCallback(async (body) => {
    const token = await getAuthToken();
    if (!token) throw new Error("Your session expired. Please sign in again.");
    const response = await fetch("/api/events/workspace", {
      method: body ? "POST" : "GET",
      headers: { Authorization:`Bearer ${token}`, ...(body ? {"Content-Type":"application/json"} : {}) },
      ...(body ? {body:JSON.stringify(body)} : {})
    });
    const data = await response.json().catch(()=>({}));
    if (!response.ok || !data.ok) throw new Error(data.error || "The event request failed.");
    return data;
  },[]);

  const load = useCallback(async () => {
    setBusy(true); setError("");
    try { const data = await request(); setEvents(data.events || []); }
    catch(e) { setError(e.message); }
    finally { setBusy(false); }
  },[request]);

  useEffect(()=>{ load(); },[load]);

  const change = e => setDraft(current=>({...current,[e.target.name]:e.target.value}));
  const reset = () => { setDraft(empty); setEditing(""); };

  const save = async e => {
    e.preventDefault(); setBusy(true); setError(""); setNotice("");
    try {
      const data = await request({action:editing ? "update_event" : "create_event", ...(editing ? {id:editing} : {}), ...draft, startsAt:localDateTimeToIso(draft.startsAt), endsAt:localDateTimeToIso(draft.endsAt)});
      if (editing) setEvents(items=>items.map(item=>item.id===editing ? data.event : item));
      else setEvents(items=>[data.event,...items]);
      reset(); setNotice("Event draft saved. It is not publicly published yet.");
    } catch(err) { setError(err.message); }
    finally { setBusy(false); }
  };

  const edit = event => {
    setEditing(event.id);
    setDraft({title:event.title||"",description:event.description||"",category:event.category||"Events",venue:event.venue||"",city:event.city||"",startsAt:dateValue(event.starts_at),endsAt:dateValue(event.ends_at),ticketUrl:event.ticket_url||"",imageUrl:event.image_url||""});
    setNotice("");
  };

  const remove = async id => {
    if (!window.confirm("Delete this draft event?")) return;
    setBusy(true); setError(""); setNotice("");
    try { await request({action:"delete_event",id}); setEvents(items=>items.filter(item=>item.id!==id)); if(editing===id) reset(); setNotice("Draft deleted."); }
    catch(err) { setError(err.message); }
    finally { setBusy(false); }
  };

  return <section className="artist-studio-tools event-organizer-tools">
    <div className="artist-studio-heading"><div><span className="eyebrow">EVENT ORGANIZER WORKSPACE</span><h2>Bring your <em>event to life.</em></h2><p>Create and manage your event drafts. Publishing remains subject to Nochalant editorial approval.</p></div></div>
    {error && <p className="artist-studio-error" role="alert">{error}</p>}
    {notice && <p className="fine-print" role="status">{notice}</p>}
    <div className="workspace-overview-grid"><article className="account-dashboard-card"><span className="eyebrow">TOTAL EVENTS</span><h3>{events.length}</h3><p>Events and drafts</p></article><article className="account-dashboard-card"><span className="eyebrow">PUBLISHED</span><h3>{events.filter(item=>item.status==="published"||item.status==="approved").length}</h3><p>Publicly approved events</p></article><article className="account-dashboard-card"><span className="eyebrow">DRAFTS</span><h3>{events.filter(item=>item.status==="draft").length}</h3><p>Awaiting submission or review</p></article></div>
    <form className="artist-studio-form event-organizer-form" onSubmit={save}>
      <h3>{editing ? "Edit event draft" : "Create an event"}</h3>
      <label>Event title<input name="title" value={draft.title} onChange={change} required minLength="4" maxLength="140" placeholder="e.g. Nochalant Live Sessions"/></label>
      <label>Category<select name="category" value={draft.category} onChange={change}><option>Music</option><option>Clubs & Nightlife</option><option>Entertainment</option><option>Fashion</option><option>Business</option><option>Community</option><option>Events</option></select></label>
      <label>Description<textarea name="description" value={draft.description} onChange={change} rows="4" maxLength="4000" placeholder="What should attendees know?"/></label>
      <div className="artist-studio-form-grid">
        <label>Venue<input name="venue" value={draft.venue} onChange={change} maxLength="180" placeholder="Venue name"/></label>
        <label>City<input name="city" value={draft.city} onChange={change} maxLength="100" placeholder="Lagos, Nigeria"/></label>
        <label>Starts at<input type="datetime-local" name="startsAt" value={draft.startsAt} onChange={change} required/></label>
        <label>Ends at (optional)<input type="datetime-local" name="endsAt" value={draft.endsAt} onChange={change}/></label>
        <label>Ticket link (HTTPS)<input type="url" name="ticketUrl" value={draft.ticketUrl} onChange={change} placeholder="https://..."/></label>
        <label>Event image URL (HTTPS)<input type="url" name="imageUrl" value={draft.imageUrl} onChange={change} placeholder="https://..."/></label>
      </div>
      <div className="artist-studio-form-actions"><button className="button button-green" type="submit" disabled={busy}>{busy ? "Saving…" : editing ? "Update draft" : "Save event draft"}</button>{editing && <button className="button button-outline" type="button" onClick={reset} disabled={busy}>Cancel edit</button>}</div>
    </form>
    <div className="artist-studio-heading"><div><span className="eyebrow">YOUR EVENTS</span><h2>Event <em>manager.</em></h2></div><button className="button button-outline" type="button" onClick={load} disabled={busy}>Refresh</button></div>
    {busy && !events.length ? <p className="fine-print">Loading your events…</p> : events.length ? <div className="event-organizer-list">{events.map(event=><article className="account-dashboard-card" key={event.id}>
      <span className="dashboard-status">{String(event.status).toUpperCase()}</span><h3>{event.title}</h3><p>{event.category} · {event.city || "Location not set"} · {new Date(event.starts_at).toLocaleString()}</p><p>{event.description}</p>
      <div className="artist-studio-form-actions">{event.status==="draft" && <><button className="button button-outline" type="button" onClick={()=>edit(event)} disabled={busy}>Edit</button><button className="button button-outline" type="button" onClick={()=>remove(event.id)} disabled={busy}>Delete</button></>}</div>
    </article>)}</div> : <p className="fine-print">No event drafts yet. Create your first event above.</p>}
  </section>;
}
