export default function WelcomePage() {
  return (
    <main className="welcome-art-screen" aria-label="Welcome to Nochalant Club">
      <div className="welcome-art-frame">
        <img
          src="/nochalant-welcome.webp"
          alt="Nochalant Club — An independent social club, 18+. Welcome to the club. Your people. Your scene. Your rules."
          className="welcome-art-image"
          fetchPriority="high"
        />
        <a href="/join" className="welcome-art-enter" aria-label="Enter the Club" />
        <a href="/sign-in" className="welcome-art-signin" aria-label="Already a member? Sign in" />
      </div>
    </main>
  );
}
