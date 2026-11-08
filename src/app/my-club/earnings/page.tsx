"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Application = { id: string; sceneName: string | null; requestedFeatures: string[]; status: string; reviewNote: string | null; createdAt: string };
type Wallet = { currency: string; availableKobo: string; pendingKobo: string; lifetimeCreditsKobo: string; ledger: { id: string; entryType: string; amountKobo: string; sourceType: string; createdAt: string }[] };

const FEATURE_OPTIONS = [
  { value: "PAID_SCENE_MEMBERSHIP", label: "Paid Scene memberships" },
  { value: "TICKETED_EVENTS", label: "Ticketed events" },
  { value: "EXCLUSIVE_CONTENT", label: "Exclusive content" },
  { value: "BRAND_PARTNERSHIPS", label: "Brand partnerships" },
];

const naira = (kobo: string) => new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 2 }).format(Number(kobo) / 100);

export default function CreatorEarningsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [sceneName, setSceneName] = useState("");
  const [audienceSummary, setAudienceSummary] = useState("");
  const [features, setFeatures] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState("");

  async function refresh() {
    const response = await fetch("/api/me/creator-earnings", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Unable to load creator earnings.");
    setApplications(data.applications);
    setWallet(data.wallet);
  }

  useEffect(() => {
    let active = true;
    fetch("/api/me/creator-earnings", { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to load creator earnings.");
        return data;
      })
      .then((data) => {
        if (!active) return;
        setApplications(data.applications);
        setWallet(data.wallet);
      })
      .catch((error: unknown) => {
        if (active) setNotice(error instanceof Error ? error.message : "Unable to load creator earnings.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  function toggleFeature(value: string) {
    setFeatures((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setNotice("");
    try {
      const response = await fetch("/api/me/creator-earnings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sceneName, audienceSummary, requestedFeatures: features }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Application could not be submitted.");
      setNotice("Application submitted. The Nochalant team will review your community.");
      setSceneName("");
      setAudienceSummary("");
      setFeatures([]);
      await refresh();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Application could not be submitted.");
    } finally {
      setSubmitting(false);
    }
  }

  const activeApplication = applications.find((application) => application.status === "PENDING" || application.status === "APPROVED");

  return (
    <main className="feed-shell">
      <header className="screen-heading">
        <Link href="/my-club" className="selection-hint">← My Club</Link>
        <p className="mt-5 text-[10px] font-black tracking-[.25em] text-[#ed5266]">NOCHALANT CREATOR ECONOMY</p>
        <h1>Creator earnings</h1>
        <p>Build a trusted community. Apply to unlock ways to earn from it.</p>
      </header>

      {notice ? <div className="membership-row" role="status">{notice}</div> : null}
      {loading ? <div className="empty-state">Loading your creator wallet…</div> : (
        <>
          <section className="stats-grid">
            <div><strong>{naira(wallet?.availableKobo ?? "0")}</strong><small>Available balance</small></div>
            <div><strong>{naira(wallet?.pendingKobo ?? "0")}</strong><small>Pending balance</small></div>
            <div><strong>{naira(wallet?.lifetimeCreditsKobo ?? "0")}</strong><small>Lifetime credits</small></div>
          </section>
          <p className="selection-hint">Balances are ledger-based. Withdrawals are not enabled yet; funds will only become withdrawable after payout verification and provider integration.</p>

          <section className="membership-row">
            <div>
              <strong>{activeApplication ? `Application: ${activeApplication.status.toLowerCase()}` : "Apply for creator monetisation"}</strong>
              <small className="block text-white/55">Higher reputation unlocks eligibility to apply, but approval depends on genuine audience quality and community safety.</small>
            </div>
          </section>

          {!activeApplication || activeApplication.status === "REJECTED" ? (
            <form onSubmit={submit} className="space-y-4 rounded-2xl border border-white/10 bg-white/[.03] p-4">
              <label className="block text-sm">Scene or community name (optional)
                <input value={sceneName} onChange={(event) => setSceneName(event.target.value)} maxLength={100} className="mt-2 w-full rounded-xl border border-white/15 bg-black/30 p-3" placeholder="Your community name" />
              </label>
              <fieldset className="space-y-3">
                <legend className="mb-2 text-sm font-semibold">What would you like to monetise?</legend>
                {FEATURE_OPTIONS.map((feature) => <label key={feature.value} className="flex items-center gap-3 text-sm">
                  <input type="checkbox" checked={features.includes(feature.value)} onChange={() => toggleFeature(feature.value)} />
                  {feature.label}
                </label>)}
              </fieldset>
              <label className="block text-sm">Tell us about your audience and community
                <textarea required minLength={20} maxLength={2000} value={audienceSummary} onChange={(event) => setAudienceSummary(event.target.value)} className="mt-2 min-h-28 w-full rounded-xl border border-white/15 bg-black/30 p-3" placeholder="Describe your audience, activity, community standards and what members receive." />
              </label>
              <button disabled={submitting || !features.length} className="w-full rounded-xl bg-[#ed2939] px-4 py-3 font-semibold disabled:opacity-50">{submitting ? "Submitting…" : "Submit for review"}</button>
            </form>
          ) : activeApplication.status === "PENDING" ? (
            <div className="membership-row"><strong>Your application is awaiting review.</strong></div>
          ) : (
            <div className="membership-row"><strong>Creator monetisation approved.</strong><small className="block text-white/55">Your monetisation features will be enabled as the corresponding products launch.</small></div>
          )}

          <section className="mt-6">
            <h2 className="mb-3 text-lg font-bold">Earnings activity</h2>
            {wallet?.ledger.length ? wallet.ledger.map((entry) => <article key={entry.id} className="membership-row">
              <div><strong>{entry.entryType.replaceAll("_", " ")}</strong><small className="block text-white/50">{entry.sourceType} · {new Date(entry.createdAt).toLocaleDateString("en-NG")}</small></div>
              <strong>{naira(entry.amountKobo)}</strong>
            </article>) : <p className="selection-hint">No earnings yet. Approved monetisation and verified payments will appear here.</p>}
          </section>
        </>
      )}
      <nav className="bottom-nav">
        <Link href="/club">⌂<small>Home</small></Link><Link href="/discover">◉<small>Discover</small></Link>
        <Link className="create-button" href="/club/create">＋</Link><Link href="/chats">▢<small>Chats</small></Link>
        <Link className="active" href="/my-club">♙<small>My Club</small></Link>
      </nav>
    </main>
  );
}
