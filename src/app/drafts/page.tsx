"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { deleteOfflineDraft, listOfflineDrafts, type OfflineDraft } from "@/lib/offline-drafts";

export default function DraftsPage() {
 const [drafts,setDrafts]=useState<OfflineDraft[]>([]);
 const [ready,setReady]=useState(false);
 const [error,setError]=useState("");
 async function refresh(){try{setDrafts(await listOfflineDrafts());setError("");}catch(e){setError(e instanceof Error?e.message:"Device drafts are unavailable.");}finally{setReady(true);}}
 useEffect(()=>{let active=true;listOfflineDrafts().then(rows=>{if(active)setDrafts(rows);}).catch(e=>{if(active)setError(e instanceof Error?e.message:"Device drafts are unavailable.");}).finally(()=>{if(active)setReady(true);});return()=>{active=false;};},[]);
 async function remove(id:string){await deleteOfflineDraft(id);await refresh();}
 return <main className="feed-shell">
  <header className="screen-heading"><p className="onboard-kicker">ON THIS DEVICE</p><h1>Offline drafts</h1><p>Private drafts stored locally on this device.</p></header>
  {!ready&&<p className="selection-hint">Loading device drafts…</p>}
  {error&&<p className="owner-notice">{error}</p>}
  {ready&&!drafts.length&&!error&&<section className="empty-state"><strong>No saved drafts</strong><p>Save a post while offline or before publishing and it will appear here.</p></section>}
  <section className="offline-draft-list">{drafts.map(draft=><article key={draft.id}><div><span>{draft.kind.toUpperCase()} · {new Date(draft.createdAt).toLocaleString()}</span><p>{draft.body}</p><small>Saved on this device · waiting for you to publish</small></div><button onClick={()=>void remove(draft.id)} aria-label="Delete draft">Delete</button></article>)}</section>
  <Link href="/club/create" className="yellow-cta">Create a draft <span>→</span></Link>
 </main>;
}
