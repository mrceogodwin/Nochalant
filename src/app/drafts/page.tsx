"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { deleteOfflineDraft, listOfflineDrafts, type OfflineDraft } from "@/lib/offline-drafts";

type DraftPayload = { text?: string; kind?: string; options?: string[]; audience?: string };

function readDraftBody(body: string): DraftPayload {
  try {
    const value: unknown = JSON.parse(body);
    if (value && typeof value === "object" && "text" in value) {
      const draft = value as DraftPayload;
      return {
        text: typeof draft.text === "string" ? draft.text : body,
        kind: typeof draft.kind === "string" ? draft.kind : "Post",
        options: Array.isArray(draft.options) ? draft.options.filter((item): item is string => typeof item === "string") : [],
        audience: typeof draft.audience === "string" ? draft.audience : undefined,
      };
    }
  } catch {
    // Older plain-text drafts remain readable.
  }
  return { text: body, kind: "Post" };
}

export default function DraftsPage() {
  const [drafts, setDrafts] = useState<OfflineDraft[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  async function refresh() {
    try {
      setDrafts(await listOfflineDrafts());
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Device drafts are unavailable.");
    } finally {
      setReady(true);
    }
  }
  useEffect(() => {
    let active = true;
    listOfflineDrafts()
      .then((rows) => { if (active) setDrafts(rows); })
      .catch((e: unknown) => { if (active) setError(e instanceof Error ? e.message : "Device drafts are unavailable."); })
      .finally(() => { if (active) setReady(true); });
    return () => { active = false; };
  }, []);
  async function remove(id: string) {
    try {
      await deleteOfflineDraft(id);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete this draft.");
    }
  }
  return <main className="feed-shell">
    <header className="screen-heading"><p className="onboard-kicker">ON THIS DEVICE</p><h1>Offline drafts</h1><p>Private drafts stored locally on this device.</p></header>
    {!ready && <p className="selection-hint">Loading device drafts…</p>}
    {error && <p className="owner-notice" role="alert">{error}</p>}
    {ready && !drafts.length && !error && <section className="empty-state"><strong>No saved drafts</strong><p>Save a post while offline or before publishing and it will appear here.</p></section>}
    <section className="offline-draft-list">{drafts.map((draft) => {
      const content = readDraftBody(draft.body);
      return <article key={draft.id}>
        <div>
          <span>{(content.kind || draft.kind).toUpperCase()} · {new Date(draft.createdAt).toLocaleString()}</span>
          <p>{content.text || "Untitled draft"}</p>
          {content.options?.length ? <ul>{content.options.map((option, index) => <li key={index}>{option}</li>)}</ul> : null}
          <small>Audience: {content.audience || "Not specified"} · Saved on this device</small>
        </div>
        <button onClick={() => void remove(draft.id)} aria-label="Delete draft">Delete</button>
      </article>;
    })}</section>
    <Link href="/club/create" className="yellow-cta">Create a draft <span>→</span></Link>
  </main>;
}
