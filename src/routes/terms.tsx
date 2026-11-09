import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/terms")({ component: Terms });

function Terms() {
  return (
    <main className="app-scroll mx-auto h-full max-w-md bg-bg px-5 py-8 text-fg">
      <Link to="/" className="text-sm text-secondary">
        Back
      </Link>
      <h1 className="mt-4 font-display text-3xl font-semibold">Terms</h1>
      <div className="mt-4 flex flex-col gap-3 text-sm text-secondary">
        <p>Nochalant Club is an 18+ social product. By entering, you confirm you are an adult and you will treat other members as people, not content.</p>
        <p>You keep ownership of what you post. You give the Club permission to show it to the audience you chose: public, followers, a room, a squad, or one person.</p>
        <p>Gifts and Club Tokens, when they are switched on, are digital expressions. They are not cash, not a wager, and not a promise of payout.</p>
        <p>We can remove content, suspend a room, or close an account that breaks the community guidelines. You can leave, export what this preview stores on your device, or delete that local Club from My Club.</p>
      </div>
    </main>
  );
}
