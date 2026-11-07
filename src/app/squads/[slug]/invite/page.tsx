"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";

export default function SquadInvitePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  useEffect(() => {
    const value = new URLSearchParams(window.location.search).get("token") || "";
    setToken(value);
    if (!value) setError("This invitation link is incomplete.");
  }, []);
  async function accept() {
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/squads/${encodeURIComponent(slug)}/invitations/accept`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Invitation could not be accepted.");
      setDone(true);
      window.location.assign(`/squads/${encodeURIComponent(slug)}`);
    } catch (e) { setError(e instanceof Error ? e.message : "Invitation could not be accepted."); }
    finally { setBusy(false); }
  }
  return <main className="onboard-shell"><header className="chat-header"><Link href="/squads">‹</Link><div><strong>Squad invitation</strong><small>You're invited</small></div></header><section className="onboard-content"><p className="onboard-kicker">YOUR PEOPLE. YOUR CIRCLE.</p><h1>You've got<br/><em>a place here.</em></h1><p>Accept this invitation to join the Squad. Invitation links expire after seven days and can only be used once.</p>{error && <p role="alert" className="form-error">{error}</p>}{done ? <p role="status">Invitation accepted. Opening your Squad…</p> : <button className="yellow-cta" disabled={!token || busy} onClick={accept}>{busy ? "Accepting…" : "Accept invitation →"}</button>}<Link href="/squads" className="text-back">Back to Squads</Link></section></main>;
}
