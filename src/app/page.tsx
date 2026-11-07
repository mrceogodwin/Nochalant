import Link from "next/link";

export default function WelcomePage() {
  return (
    <main className="club-shell">
      <header className="flex justify-center pt-8 pb-2" aria-label="Nochalant Club">
        <div className="club-logo" aria-label="Nochalant Club">
          <span>Nochalant</span>
          <small>CLUB</small>
        </div>
      </header>

      <section className="welcome-visual" aria-labelledby="welcome-title">
        <div className="welcome-copy">
          <p className="eyebrow">An independent social club · 18+</p>
          <h1 id="welcome-title" className="display-title">
            Welcome to<br />Nochalant <span>Club.</span>
          </h1>
          <p className="supporting">Your people. Your scene. Your rules.</p>
        </div>
      </section>

      <section className="space-y-4" aria-label="Join Nochalant Club">
        <Link href="/join" className="club-primary flex items-center justify-center gap-3 no-underline">
          Enter the Club <span aria-hidden="true">→</span>
        </Link>
        <Link href="/sign-in" className="club-secondary flex items-center justify-center no-underline">
          Already a member? <span className="ml-1 text-white underline decoration-[var(--red)] underline-offset-4">Sign in</span>
        </Link>
      </section>

      <footer className="club-footer">
        <p>18+ only · Respect the people. Respect the scene.</p>
        <p className="mt-2">NOCHALANT CLUB</p>
      </footer>
    </main>
  );
}
