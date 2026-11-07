/* eslint react-hooks/set-state-in-effect: off -- Existing client effects coordinate asynchronous data loading or display copy; tracked for targeted refactoring. */
"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";

export default function SignInPage() {
  const [verificationNotice, setVerificationNotice] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const status = new URLSearchParams(window.location.search).get("verification");
    if (status === "complete") setVerificationNotice("Your email is verified. You can now sign in when the V2 account services are configured.");
    if (status === "expired") setVerificationNotice("That verification link has expired. Request a new one when account services are available.");
    if (status === "invalid") setVerificationNotice("That verification link is not valid.");
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl: "/club",
      });
      if (result?.error) {
        setError("We couldn't sign you in. Check your details, verify your email, or try again later.");
      } else if (result?.url) {
        window.location.assign(result.url);
      } else {
        setError("Sign-in is not available yet. Please try again later.");
      }
    } catch {
      setError("Sign-in is temporarily unavailable. Please try again later.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="onboard-shell">
      <header className="onboard-top">
        <Link href="/" className="back-link" aria-label="Back to welcome">‹</Link>
        <span className="step-count">NOCHALANT CLUB</span>
      </header>
      <section className="onboard-content">
        <p className="onboard-kicker">GOOD TO HAVE YOU BACK</p>
        <h1>Back to<br/><em>your people.</em></h1>
        <p className="onboard-description">Sign in with your verified Club account.</p>
        {verificationNotice && <div className="owner-notice" role="status"><strong>Email verification</strong><p>{verificationNotice}</p></div>}
        <form onSubmit={submit}>
          <label className="field-label" htmlFor="signin-email">Email address</label>
          <input id="signin-email" className="club-input" type="email" autoComplete="email" required maxLength={254} value={email} onChange={event => setEmail(event.target.value)} placeholder="you@example.com"/>
          <label className="field-label" htmlFor="signin-password">Password</label>
          <input id="signin-password" className="club-input" type="password" autoComplete="current-password" required maxLength={128} value={password} onChange={event => setPassword(event.target.value)} placeholder="Your password"/>
          <button className="yellow-cta" type="submit" disabled={busy || !email.includes("@") || !password}>{busy ? "Signing in…" : "Sign in"} <span>→</span></button>
        </form>
        {error && <p role="alert" className="form-error">{error}</p>}
        <Link href="/forgot-password" className="text-back">Forgot your password?</Link>
        <Link href="/join" className="text-back">New here? Join the Club</Link>
      </section>
      <footer className="onboard-footer"><span>NOCHALANT CLUB</span><span>YOUR PEOPLE. YOUR SCENE.</span></footer>
    </main>
  );
}
