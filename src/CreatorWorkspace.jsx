import React, { useCallback, useEffect, useState } from "react";
import { getAuthToken } from "./auth.js";

const categories = [
  ["content_creator","Content creator"],["influencer","Influencer"],["photographer","Photographer"],
  ["videographer","Videographer"],["writer","Writer"],["presenter","Presenter"],["comedian","Comedian"],["other","Other"]
];

export default function CreatorWorkspace() {
  const [data, setData] = useState({ profile: null, portfolio: [], bookings: [], stats: { portfolioItems: 0, pendingBookings: 0 } });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const request = useCallback(async (method = "GET", body) => {
    const token = await getAuthToken();
    if (!token) throw new Error("Your session has expired. Please sign in again.");
    const response = await fetch("/api/creator/workspace", {
      method,
      headers: { Accept: "application/json", Authorization: "Bearer " + token, ...(body ? { "Content-Type": "application/json" } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}),
      cache: "no-store"
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.ok) throw new Error(result.error || "Creator workspace request failed.");
    return result;
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true); setError("");
    try { setData(await request()); }
    catch (e) { setError(e?.message || "Creator workspace could not load."); }
    finally { setLoading(false); }
  }, [request]);

  useEffect(() => { refresh(); }, [refresh]);

  const submit = async (event, action) => {
    event.preventDefault(); if (busy) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const form = new FormData(event.currentTarget);
      const payload = { action };
      for (const [key, value] of form.entries()) if (typeof value === "string") payload[key] = value.trim();
      const result = await request("POST", payload);
      if (action === "save_profile") setNotice("Creator profile saved.");
      if (action === "add_portfolio_item") { setNotice("Portfolio item added."); event.currentTarget.reset(); }
      await refresh();
    } catch (e) { setError(e?.message || "Could not save this change."); }
    finally { setBusy(false); }
  };

  const act = async payload => {
    if (busy) return;
    setBusy(true); setError(""); setNotice("");
    try { await request("POST", payload); setNotice("Change saved."); await refresh(); }
    catch (e) { setError(e?.message || "Action could not be completed."); }
    finally { setBusy(false); }
  };

  const profile = data.profile || {};
  return <section className="creator-workspace-tools" aria-label="Creator workspace">
    <div className="artist-studio-heading"><div><span className="eyebrow">CREATOR WORKSPACE</span><h2>Build your <em>presence.</em></h2><p>Manage your public creator identity, showcase your work and handle booking enquiries.</p></div></div>
    {loading && <p className="account-dashboard-loading" role="status">Loading your creator workspace…</p>}
    {error && <p className="artist-studio-error" role="alert">{error}</p>}
    {notice && <p className="dashboard-status" role="status">{notice}</p>}
    {!loading && <div className="creator-workspace-stats"><article className="account-dashboard-card"><span className="eyebrow">PORTFOLIO</span><h3>{data.stats?.portfolioItems || 0}</h3><p>Published work samples</p></article><article className="account-dashboard-card"><span className="eyebrow">BOOKING INBOX</span><h3>{data.stats?.pendingBookings || 0}</h3><p>Pending enquiries</p></article></div>}
    <div className="artist-studio-forms">
      <form className="artist-studio-form" onSubmit={e => submit(e,"save_profile")}>
        <h3>Public creator profile</h3>
        <label>Creator / brand name<input name="displayTitle" required maxLength="120" defaultValue={profile.display_title || ""} placeholder="How people know your work"/></label>
        <label>Creator category<select name="category" defaultValue={profile.creator_category || "content_creator"}>{categories.map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label>Biography<textarea name="bio" rows="5" maxLength="3000" defaultValue={profile.bio || ""} placeholder="Tell people what you create…"/></label>
        <label>Location<input name="location" maxLength="120" defaultValue={profile.location || ""} placeholder="City, country"/></label>
        <label>Website / portfolio link<input name="websiteUrl" type="url" defaultValue={profile.website_url || ""} placeholder="https://…"/></label>
        <label>Booking contact email<input name="contactEmail" type="email" defaultValue={profile.contact_email || ""} placeholder="Bookings email"/></label>
        <button className="button button-green" disabled={busy}>{busy ? "Saving…" : "Save creator profile"}</button>
      </form>
      <form className="artist-studio-form" onSubmit={e => submit(e,"add_portfolio_item")}>
        <h3>Add portfolio work</h3>
        <label>Project title<input name="title" required minLength="2" maxLength="120" placeholder="Campaign, video, article or project"/></label>
        <label>Description<textarea name="description" rows="3" maxLength="1000" placeholder="What did you create?"/></label>
        <label>Media URL<input name="mediaUrl" type="url" placeholder="https://… (optional)"/></label>
        <label>Project / published link<input name="externalUrl" type="url" placeholder="https://… (optional)"/></label>
        <button className="button button-green" disabled={busy || !data.profile}>{busy ? "Saving…" : "Add to portfolio"}</button>
        {!data.profile && <small className="fine-print">Save your creator profile before adding portfolio work.</small>}
      </form>
    </div>
    <section className="creator-portfolio-list"><h3>Your portfolio</h3>
      {data.portfolio.length ? <div className="account-dashboard-grid">{data.portfolio.map(item => <article className="account-dashboard-card" key={item.id}><span className="eyebrow">PORTFOLIO ITEM</span><h3>{item.title}</h3>{item.description && <p>{item.description}</p>}{item.media_url && <a href={item.media_url} target="_blank" rel="noreferrer">View media ↗</a>}{item.external_url && <a href={item.external_url} target="_blank" rel="noreferrer">Open project ↗</a>}<button type="button" className="button button-outline" disabled={busy} onClick={() => act({action:"delete_portfolio_item",itemId:item.id})}>Remove item</button></article>)}</div> : <p className="account-dashboard-loading">Your portfolio is empty. Add your first work sample above.</p>}
    </section>
    <section className="creator-booking-inbox"><div className="artist-studio-heading"><div><span className="eyebrow">BOOKING ENQUIRIES</span><h3>Manage your requests</h3></div><label className="creator-booking-toggle"><input type="checkbox" checked={profile.booking_enabled === true} disabled={busy || !data.profile} onChange={e => act({action:"set_booking_enabled",enabled:e.target.checked})}/> Accept booking enquiries</label></div>
      {!data.bookings.length ? <p className="account-dashboard-loading">No booking requests yet. Enquiries will appear here when the public booking form is connected.</p> : <div className="account-dashboard-grid">{data.bookings.map(item => <article className="account-dashboard-card" key={item.id}><span className="eyebrow">{item.status.toUpperCase()}</span><h3>{item.requester_name}</h3><p>{item.message}</p><a href={"mailto:"+item.requester_email}>{item.requester_email}</a>{item.requested_for && <p>Requested: {new Date(item.requested_for).toLocaleString()}</p>}{item.status === "pending" && <div className="creator-booking-actions"><button type="button" className="button button-green" disabled={busy} onClick={() => act({action:"update_booking_status",bookingId:item.id,status:"accepted"})}>Accept</button><button type="button" className="button button-outline" disabled={busy} onClick={() => act({action:"update_booking_status",bookingId:item.id,status:"declined"})}>Decline</button></div>}</article>)}</div>}
    </section>
  </section>;
}
