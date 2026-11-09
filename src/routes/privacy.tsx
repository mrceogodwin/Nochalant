import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({ component: Privacy });

function Privacy() {
  return (
    <main className="app-scroll mx-auto h-full max-w-md bg-bg px-5 py-8 text-fg">
      <Link to="/" className="text-sm text-secondary">
        Back
      </Link>
      <h1 className="mt-4 font-display text-3xl font-semibold">Privacy</h1>
      <div className="mt-4 flex flex-col gap-3 text-sm text-secondary">
        <p>This preview keeps your Club ID, follows, posts and messages on this device. Voice notes stay for the session. Nothing in the sign-in form is sent to a server.</p>
        <p>A private profile means people have to be let in. Blocking hides a member from your feed on this device. Reports are saved locally until a moderation desk exists.</p>
        <p>Precise location is never asked for and never shown. Voice transcription is off.</p>
        <p>Leaving the preview from My Club clears the Club stored in this browser.</p>
      </div>
    </main>
  );
}
