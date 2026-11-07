"use client";

import Link from "next/link";

export default function SignInPage() {
  return (
    <main className="onboard-shell">
      <header className="onboard-top">
        <Link href="/" className="back-link" aria-label="Back to welcome">‹</Link>
        <span className="step-count">NOCHALANT CLUB</span>
      </header>
      <section className="onboard-content">
        <p className="onboard-kicker">GOOD TO HAVE YOU BACK</p>
        <h1>Back to<br/><em>your people.</em></h1>
        <p className="onboard-description">Sign-in is being connected as part of the Club's secure account setup.</p>
        <div className="profile-preview">
          <div className="avatar-placeholder">N</div>
          <div><strong>Member sign-in</strong><span>Account access is not active yet</span></div>
          <b>✦</b>
        </div>
        <div className="owner-notice" role="status">
          <strong>Almost there.</strong>
          <p>We’re finishing secure authentication before enabling member accounts. Your sign-in details will never be requested on this preview screen.</p>
        </div>
        <Link href="/join" className="yellow-cta link-cta">Explore joining the Club <span>→</span></Link>
        <Link href="/" className="text-back">Back to welcome</Link>
      </section>
      <footer className="onboard-footer"><span>NOCHALANT CLUB</span><span>YOUR PEOPLE. YOUR SCENE.</span></footer>
    </main>
  );
}
