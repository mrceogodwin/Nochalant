"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import type { FormEvent } from "react";
import { useSearchParams } from "next/navigation";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    if (password !== confirm) {
      setError("Your passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      const response = await fetch("/api/password/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const result = await response.json();
      if (!response.ok) setError(result.error || "Password could not be updated.");
      else setMessage(result.message || "Your password has been updated.");
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
        <h1>Choose a new<br/><em>password.</em></h1>
        {!token && <div className="owner-notice" role="alert"><strong>Reset link missing</strong><p>Open the complete link from your password reset email.</p></div>}
        {token && !message && <form onSubmit={submit}>
          <label className="field-label" htmlFor="new-password">New password</label>
          <input id="new-password" className="club-input" type="password" autoComplete="new-password" minLength={12} maxLength={128} required value={password} onChange={event => setPassword(event.target.value)} placeholder="At least 12 characters"/>
          <label className="field-label" htmlFor="confirm-password">Confirm new password</label>
          <input id="confirm-password" className="club-input" type="password" autoComplete="new-password" minLength={12} maxLength={128} required value={confirm} onChange={event => setConfirm(event.target.value)} placeholder="Enter it again"/>
          <button className="yellow-cta" type="submit" disabled={busy || password.length < 12 || confirm.length < 12}>{busy ? "Updating…" : "Update password"} <span>→</span></button>
        </form>}
        {message && <div className="owner-notice" role="status"><strong>All set</strong><p>{message}</p><Link href="/sign-in">Go to sign in</Link></div>}
        {error && <p role="alert" className="form-error">{error}</p>}
        <Link href="/sign-in" className="text-back">Back to sign in</Link>
      </section>
      <footer className="onboard-footer"><span>NOCHALANT CLUB</span><span>YOUR PEOPLE. YOUR SCENE.</span></footer>
    </main>
  );
}

export default function ResetPasswordPage() {
  return <Suspense fallback={<main className="onboard-shell"><p>Loading secure reset…</p></main>}><ResetPasswordForm /></Suspense>;
}
