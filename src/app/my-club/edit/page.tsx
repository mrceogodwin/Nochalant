"use client";

import Link from "next/link";
import { useState } from "react";

export default function EditClubProfile() {
  const [displayName, setDisplayName] = useState("NightCurator");
  const [username, setUsername] = useState("nightcurator");
  const [bio, setBio] = useState("Finding the sounds, scenes and people shaping the city.");
  const [city, setCity] = useState("Lagos");
  const [discoverable, setDiscoverable] = useState(true);

  return (
    <main className="onboard-shell">
      <header className="chat-header"><Link href="/my-club">‹</Link><div><strong>Edit your profile</strong><small>Shape how the Club sees you</small></div></header>
      <section className="onboard-content">
        <p className="onboard-kicker">YOUR CLUB IDENTITY</p>
        <h1>Make it<br/><em>your own.</em></h1>
        <div className="profile-preview"><div className="avatar-placeholder">N</div><div><strong>Profile preview</strong><span>Changes are local until account setup is connected</span></div></div>
        <label className="field-label" htmlFor="display-name">Display name</label>
        <input id="display-name" className="club-input" value={displayName} onChange={e=>setDisplayName(e.target.value.slice(0,32))} maxLength={32}/>
        <label className="field-label" htmlFor="username">Username</label>
        <input id="username" className="club-input" value={username} onChange={e=>setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g,"").toLowerCase().slice(0,20))} maxLength={20}/>
        <label className="field-label" htmlFor="bio">About you</label>
        <textarea id="bio" className="create-textarea profile-bio" value={bio} onChange={e=>setBio(e.target.value.slice(0,280))} maxLength={280}/>
        <span className="selection-hint">{bio.length}/280 characters</span>
        <label className="field-label" htmlFor="city">City</label>
        <input id="city" className="club-input" value={city} onChange={e=>setCity(e.target.value.slice(0,40))} maxLength={40}/>
        <label className="privacy-toggle"><span><strong>Show me in Discover</strong><small>Allow other members to find your profile.</small></span><input type="checkbox" checked={discoverable} onChange={e=>setDiscoverable(e.target.checked)}/></label>
        <div className="owner-notice"><strong>Preview mode</strong><p>Your edits update this screen only. Profile saving will be enabled when member accounts and the database are connected.</p></div>
        <Link href="/my-club" className="yellow-cta link-cta">Back to My Club <span>→</span></Link>
      </section>
    </main>
  );
}
