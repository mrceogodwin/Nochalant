"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";

export default function CreateScenePage() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Music");
  const [visibility, setVisibility] = useState("PUBLIC");
  const [priceNaira, setPriceNaira] = useState("2500");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/scenes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name, description, category, visibility, rules: [],
          ...(visibility === "PAID" ? { accessPriceNaira: Number(priceNaira) } : {}),
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error || "We couldn't create your Scene.");
        return;
      }
      window.location.assign(`/scenes/${result.scene.slug}`);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="onboard-shell">
      <header className="onboard-top">
        <Link href="/discover" className="back-link" aria-label="Back to Discover"><ArrowLeft /></Link>
        <span className="step-count">CREATE A SCENE</span>
      </header>
      <section className="onboard-content">
        <p className="onboard-kicker">BUILD YOUR COMMUNITY</p>
        <h1>Create your<br /><em>own Scene.</em></h1>
        <p className="onboard-description">Give your people a place to meet, share and build something together.</p>
        <form onSubmit={submit}>
          <label className="field-label" htmlFor="scene-name">Scene name</label>
          <input id="scene-name" className="club-input" required minLength={3} maxLength={48} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Lagos Unfiltered" />
          <label className="field-label" htmlFor="scene-description">Description</label>
          <textarea id="scene-description" className="create-textarea" required minLength={15} maxLength={500} value={description} onChange={e => setDescription(e.target.value)} placeholder="What brings your community together?" />
          <label className="field-label" htmlFor="scene-category">Category</label>
          <select id="scene-category" className="club-input" value={category} onChange={e => setCategory(e.target.value)}>
            {["Music", "Lifestyle", "Nightlife", "Fashion", "Entertainment", "Film", "Creative Arts", "Technology", "Relationships", "Campus", "Travel", "Food", "Gaming", "General"].map(c => <option key={c}>{c}</option>)}
          </select>
          <label className="field-label" htmlFor="scene-visibility">Who can see this Scene?</label>
          <select id="scene-visibility" className="club-input" value={visibility} onChange={e => setVisibility(e.target.value)}>
            <option value="PUBLIC">Public — anyone can discover and join</option>
            <option value="PRIVATE">Private — membership by approval</option>
            <option value="PAID">Paid — one-time access payment</option>
            <option value="UNLISTED">Unlisted — invite or direct link</option>
          </select>
          {visibility === "PAID" && <>
            <label className="field-label" htmlFor="scene-price">One-time access price (₦)</label>
            <input id="scene-price" className="club-input" type="number" inputMode="numeric" min="1" max="10000000" step="1" required value={priceNaira} onChange={e => setPriceNaira(e.target.value)} />
            <p className="selection-hint">The amount is stored by Nochalant and verified against the payment provider before membership is activated.</p>
          </>}
          <div className="owner-notice">
            <strong>Community responsibilities</strong>
            <p>As founder, you manage the Scene and its guidelines. Harassment, scams and harmful content are not allowed.</p>
          </div>
          <button className="yellow-cta" disabled={busy || name.trim().length < 3 || description.trim().length < 15 || (visibility === "PAID" && (!Number.isInteger(Number(priceNaira)) || Number(priceNaira) < 1 || Number(priceNaira) > 10000000))}>
            {busy ? "Creating Scene…" : "Create Scene"} <span>→</span>
          </button>
          {error && <p role="alert" className="form-error">{error}</p>}
        </form>
      </section>
    </main>
  );
}
