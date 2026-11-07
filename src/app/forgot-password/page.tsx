"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/password/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error || "We could not process that request.");
      } else {
        setMessage(result.message || "If an eligible account exists, a reset link will be sent.");
      }
    } catch {
      setError("We could not reach the server. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="onboard-shell">
      <header className="onboard-top"><Link href="/sign-in" className="back-link">‹</Link><span className="step-count">NOCHALANT CLUB</span></header>
      <section className="onboard-content">
        <p className="onboard-kicker">ACCOUNT RECOVERY</p>
        <h1>Forgot your<br/><em>password?</em></h1>
        <p className="onboard-description">Enter the email address on your verified Club account. We’ll send a time-limited reset link if it is eligible.</p>
        <form onSubmit={submit}>
          <label className="field-label" htmlFor="recovery-email">Email address</label>
          <input id="recovery-email" className="club-input" type="email" autoComplete="email" required maxLength={254} value={email} onChange={event => setEmail(event.target.value)} placeholder="you@example.com"/>
          <button className="yellow-cta" type="submit" disabled={busy || !email.includes("@")}>{busy ? "Sending…" : "Send reset link"} <span>→</span></button>
        </form>
        {message && <div className="owner-notice" role="status"><strong>Check your inbox</strong><p>{message}</p></div>}
        {error && <p role="alert" className="form-error">{error}</p>}
        <Link href="/sign-in" className="text-back">Back to sign in</Link>
      </section>
      <footer className="onboard-footer"><span>NOCHALANT CLUB</span><span>YOUR PEOPLE. YOUR SCENE.</span></footer>
    </main>
  );
}
