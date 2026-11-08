"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Application = {
  id: string; sceneName: string | null; requestedFeatures: string[]; audienceSummary: string;
  status: string; reviewNote: string | null; createdAt: string;
  applicant: { id: string; username: string; displayName: string; email: string; profile: { reputationXp: number; rankId: string | null } | null };
};

const featureNames: Record<string, string> = {
  PAID_SCENE_MEMBERSHIP: "Paid Scene memberships",
  TICKETED_EVENTS: "Ticketed events",
  EXCLUSIVE_CONTENT: "Exclusive content",
  BRAND_PARTNERSHIPS: "Brand partnerships",
};

export default function CreatorApplicationsAdminPage() {
  const [items, setItems] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [note, setNote] = useState<Record<string, string>>({});

  async function load() {
    const response = await fetch("/api/admin/creator-applications", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Unable to load creator applications.");
    setItems(data.applications);
  }

  useEffect(() => {
    let active = true;
    fetch("/api/admin/creator-applications", { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to load creator applications.");
        return data.applications as Application[];
      })
      .then((data) => { if (active) setItems(data); })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : "Unable to load applications.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function review(id: string, status: "APPROVED" | "REJECTED" | "SUSPENDED") {
    setBusy(id);
    setError("");
    try {
      const response = await fetch("/api/admin/creator-applications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status, reviewNote: note[id] ?? "" }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Review could not be saved.");
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Review could not be saved.");
    } finally {
      setBusy("");
    }
  }

  return (
    <main className="feed-shell admin-console">
      <header className="chat-header admin-header">
        <Link href="/admin">‹</Link>
        <div><strong>Creator Economy</strong><small>Monetisation application review</small></div>
        <span className="admin-tag">ADMIN</span>
      </header>
      <section className="admin-welcome">
        <p className="onboard-kicker">CREATOR ECONOMY</p>
        <h1>Creator<br/><em>applications.</em></h1>
        <p>Review community quality, audience authenticity and the requested earning features before enabling monetisation.</p>
      </section>
      {error ? <div className="admin-empty" role="alert">{error}</div> : null}
      {loading ? <p className="admin-empty">Loading applications…</p> : items.length ? (
        <section className="admin-member-list">
          {items.map((item) => (
            <article key={item.id} className="!block !space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div><strong>{item.applicant.displayName} · @{item.applicant.username}</strong><small className="block">{item.applicant.email}</small><small className="block">Reputation: {item.applicant.profile?.reputationXp ?? 0} XP</small></div>
                <span className="admin-tag">{item.status}</span>
              </div>
              <p className="text-sm font-semibold">{item.sceneName || "Community not specified"}</p>
              <p className="text-sm text-white/70">{item.audienceSummary}</p>
              <div className="flex flex-wrap gap-2">{item.requestedFeatures.map((feature) => <span key={feature} className="rounded-full border border-white/15 px-3 py-1 text-xs">{featureNames[feature] || feature}</span>)}</div>
              {item.reviewNote ? <p className="text-xs text-white/50">Previous review: {item.reviewNote}</p> : null}
              {item.status === "PENDING" ? (
                <>
                  <textarea value={note[item.id] ?? ""} onChange={(event) => setNote((current) => ({ ...current, [item.id]: event.target.value }))} maxLength={1000} placeholder="Internal review note (optional)" className="min-h-20 w-full rounded-xl border border-white/15 bg-black/30 p-3 text-sm"/>
                  <div className="flex flex-wrap gap-2">
                    <button disabled={busy === item.id} onClick={() => review(item.id, "APPROVED")} className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold disabled:opacity-50">Approve</button>
                    <button disabled={busy === item.id} onClick={() => review(item.id, "REJECTED")} className="rounded-xl border border-white/20 px-4 py-2 text-sm disabled:opacity-50">Reject</button>
                    <button disabled={busy === item.id} onClick={() => review(item.id, "SUSPENDED")} className="rounded-xl border border-red-400/40 px-4 py-2 text-sm text-red-300 disabled:opacity-50">Suspend</button>
                  </div>
                </>
              ) : <p className="text-xs text-white/50">Reviewed {item.createdAt ? new Date(item.createdAt).toLocaleDateString("en-NG") : ""}</p>}
            </article>
          ))}
        </section>
      ) : <p className="admin-empty">No creator monetisation applications yet.</p>}
    </main>
  );
}
