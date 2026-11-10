import { BackHeader } from "@/components/shell";
import { SUPPORT_EMAIL } from "@/lib/catalog";

export default function HelpPage() {
  return (
    <main className="px-4 pt-2">
      <BackHeader back="/profile" />
      <h1 className="mt-4 text-3xl font-extrabold">Help & Support</h1>
      <p className="mt-3 text-sm leading-6 text-zinc-300">
        Questions, reports and feedback go to <a className="font-bold text-[#ff7a00]" href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
      </p>
      <div className="mt-4 space-y-2 text-sm">
        <details className="card rounded-2xl px-4 py-3"><summary className="font-bold">How do Scenes work?</summary><p className="mt-2 text-zinc-300">Open a live room, request to speak, and chat with the room. Multi-party audio turns on when LiveKit keys are set. Until then your microphone stays on this device.</p></details>
        <details className="card rounded-2xl px-4 py-3"><summary className="font-bold">How do payments work?</summary><p className="mt-2 text-zinc-300">Pro and wallet top-ups use Paystack when PAYSTACK_SECRET_KEY is set. Without it, checkout runs in test mode and updates your account locally.</p></details>
        <details className="card rounded-2xl px-4 py-3"><summary className="font-bold">How do I report someone?</summary><p className="mt-2 text-zinc-300">Email {SUPPORT_EMAIL} with the username and what happened.</p></details>
      </div>
    </main>
  );
}
