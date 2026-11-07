"use client";
import Link from "next/link";
import {useState} from "react";
const categories=["Music","Nightlife","Fashion","Lifestyle","Campus","Arts & Culture"];
export default function CreateScene(){
 const [name,setName]=useState("");const [description,setDescription]=useState("");const [category,setCategory]=useState("Music");const [visibility,setVisibility]=useState("Public");const [rules,setRules]=useState("Be respectful.\nKeep posts relevant.\nCredit creators.");
 return <main className="onboard-shell"><header className="chat-header"><Link href="/discover">‹</Link><div><strong>Create a Scene</strong><small>Build a place for your people</small></div></header><section className="onboard-content"><p className="onboard-kicker">COMMUNITY BUILDER</p><h1>Start your<br/><em>own Scene.</em></h1><p className="onboard-description">Give a community its identity, purpose and ground rules.</p>
 <label className="field-label" htmlFor="scene-name">Scene name</label><input id="scene-name" className="club-input" value={name} onChange={e=>setName(e.target.value.slice(0,48))} placeholder="e.g. The Creative Circle" maxLength={48}/>
 <label className="field-label" htmlFor="scene-description">What is this Scene about?</label><textarea id="scene-description" className="create-textarea" value={description} onChange={e=>setDescription(e.target.value.slice(0,500))} placeholder="Tell people what brings this community together..." maxLength={500}/>
 <label className="field-label" htmlFor="scene-category">Category</label><select id="scene-category" className="club-input" value={category} onChange={e=>setCategory(e.target.value)}>{categories.map(c=><option key={c}>{c}</option>)}</select>
 <label className="field-label" htmlFor="scene-visibility">Who can discover this Scene?</label><select id="scene-visibility" className="club-input" value={visibility} onChange={e=>setVisibility(e.target.value)}><option>Public</option><option>Unlisted</option><option>Private</option></select>
 <label className="field-label" htmlFor="scene-rules">Community rules</label><textarea id="scene-rules" className="create-textarea rules-input" value={rules} onChange={e=>setRules(e.target.value.slice(0,1000))} maxLength={1000}/>
 <div className="owner-notice"><strong>Not published yet</strong><p>Creating a real Scene requires a signed-in founder, database persistence and server-side permission checks. This form is a preview only.</p></div>
 <button className="yellow-cta" disabled={!name.trim()||description.trim().length<20}>Create Scene <span>→</span></button>
 <Link href="/discover" className="text-back">Cancel</Link></section></main>
}
