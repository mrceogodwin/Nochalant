"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

const interests = [
  ["Music", "♫"], ["Nightlife", "♜"], ["Alté", "♛"], ["Fashion", "♧"],
  ["Entertainment", "▣"], ["Lifestyle", "♧"], ["Relationships", "♡"], ["Campus", "⌂"],
];
const identities = [
  ["Night Owl", "☻"], ["The Rebel", "ϟ"], ["The Curator", "♛"], ["The Creative", "◉"],
  ["The Connector", "♧"], ["The Music Head", "♫"], ["The Social One", "⌘"], ["The Observer", "◎"],
];

export default function JoinPage() {
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<string[]>(["Music", "Nightlife", "Fashion"]);
  const [identity, setIdentity] = useState("Night Owl");
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [ageOk, setAgeOk] = useState(false);
  const progress = useMemo(() => ((step + 1) / 4) * 100, [step]);

  function toggleInterest(value: string) {
    setSelected(current => current.includes(value) ? current.filter(item => item !== value) : [...current, value]);
  }

  return (
    <main className="onboard-shell">
      <header className="onboard-top">
        <Link href="/" className="back-link" aria-label="Back">‹</Link>
        <div className="step-track" aria-label={`Step ${step + 1} of 4`}>
          {Array.from({ length: 4 }).map((_, i) => <span key={i} className={i <= step ? "active" : ""} />)}
        </div>
        <span className="step-count">{step + 1}/4</span>
      </header>

      {step === 0 && <section className="onboard-content">
        <p className="onboard-kicker">YOUR CLUB STARTS HERE</p>
        <h1>Create your<br/><em>Club identity.</em></h1>
        <p className="onboard-description">A place for your people, your interests and the scenes you love.</p>
        <div className="profile-preview">
          <div className="avatar-placeholder">N</div>
          <div><strong>Your Club profile</strong><span>You can personalise this later</span></div>
          <b>✦</b>
        </div>
        <label className="field-label">What should we call you?</label>
        <input className="club-input" value={name} onChange={e => setName(e.target.value)} placeholder="Your display name" maxLength={32}/>
        <label className="field-label">Choose your @username</label>
        <input className="club-input" value={handle} onChange={e => setHandle(e.target.value.replace(/[^a-zA-Z0-9_]/g, "").toLowerCase())} placeholder="@yourhandle" maxLength={20}/>
        <label className="age-check"><input type="checkbox" checked={ageOk} onChange={e => setAgeOk(e.target.checked)}/> I confirm that I am 18 years or older.</label>
        <button className="yellow-cta" disabled={!name.trim() || handle.length < 3 || !ageOk} onClick={() => setStep(1)}>Continue <span>→</span></button>
      </section>}

      {step === 1 && <section className="onboard-content">
        <p className="onboard-kicker">MAKE IT YOURS</p>
        <h1>Choose your<br/><em>interests</em></h1>
        <p className="onboard-description">Pick at least 3. We’ll personalise your Club experience.</p>
        <div className="choice-grid">{interests.map(([label, icon]) => <button key={label} className={selected.includes(label) ? "choice-card chosen" : "choice-card"} onClick={() => toggleInterest(label)}><span className="choice-icon">{icon}</span><strong>{label}</strong>{selected.includes(label) && <i>✓</i>}</button>)}</div>
        <p className="selection-hint">{selected.length} selected · Choose at least 3</p>
        <button className="yellow-cta" disabled={selected.length < 3} onClick={() => setStep(2)}>Continue <span>→</span></button>
      </section>}

      {step === 2 && <section className="onboard-content">
        <p className="onboard-kicker">YOUR COMMUNITY PERSONA</p>
        <h1>Choose your<br/><em>identity</em></h1>
        <p className="onboard-description">This is your Club icon. It shows your vibe in the community.</p>
        <div className="choice-grid identity-grid">{identities.map(([label, icon]) => <button key={label} className={identity === label ? "choice-card chosen" : "choice-card"} onClick={() => setIdentity(label)}><span className="choice-icon">{icon}</span><strong>{label}</strong>{identity === label && <i>✓</i>}</button>)}</div>
        <button className="yellow-cta" onClick={() => setStep(3)}>Continue <span>→</span></button>
      </section>}

      {step === 3 && <section className="onboard-content finish-step">
        <div className="finish-crown">♛</div>
        <p className="onboard-kicker">YOU’RE ON THE LIST</p>
        <h1>Welcome to<br/><em>the Club.</em></h1>
        <p className="onboard-description">Your profile is ready to preview. Your people are waiting.</p>
        <div className="club-id-preview"><div className="mini-logo">Nochalant<small>CLUB</small></div><h2>{name || "New Member"}</h2><p>@{handle || "member"}</p><div className="id-meta"><span>IDENTITY<strong>{identity}</strong></span><span>INTERESTS<strong>{selected.length} selected</strong></span></div><div className="barcode">▥ ▥ ▥ ▥ ▥ ▥ ▥ ▥ ▥</div></div>
        <Link className="yellow-cta link-cta" href="/club">Enter the Club <span>→</span></Link>
        <button className="text-back" onClick={() => setStep(2)}>Go back and edit</button>
      </section>}
      <footer className="onboard-footer"><span>NOCHALANT CLUB</span><span>YOUR PEOPLE. YOUR SCENE.</span></footer>
    </main>
  );
}
