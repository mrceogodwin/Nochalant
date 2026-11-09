import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/guidelines")({ component: Guidelines });

function Guidelines() {
  return (
    <main className="app-scroll mx-auto h-full max-w-md bg-bg px-5 py-8 text-fg">
      <Link to="/" className="text-sm text-secondary">
        Back
      </Link>
      <h1 className="mt-4 font-display text-3xl font-semibold">Community guidelines</h1>
      <ul className="mt-4 flex list-disc flex-col gap-3 pl-5 text-sm text-secondary">
        <li>18+ only. Don't bring minors into the room, even as a joke.</li>
        <li>Consent is the house rule. No harassment, no coercion, no non-consensual images or voice.</li>
        <li>Chatmate is for meeting people, not an unmoderated random chat. Requests can be ignored, blocked and reported.</li>
        <li>No dangerous challenges, no dares that expose someone else's private life, no gambling.</li>
        <li>Gifts are expressions. Don't use them to pressure someone.</li>
        <li>If a room stops being fun, leave. If it stops being safe, report it.</li>
      </ul>
    </main>
  );
}
