import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Mark, Wordmark } from "@/components/club/brand";
import { Button, Field } from "@/components/club/ui";
import { useClub } from "@/lib/club/store";

export const Route = createFileRoute("/sign-in")({ component: SignIn });

function SignIn() {
  const name = useClub((state) => state.name);
  const ageOk = useClub((state) => state.ageOk);
  const confirmAge = useClub((state) => state.confirmAge);
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [adult, setAdult] = useState(ageOk);
  const [error, setError] = useState("");

  return (
    <main className="app-scroll mx-auto flex h-full w-full max-w-md flex-col bg-bg px-5 text-fg">
      <header className="pt-safe flex flex-col items-center">
        <Mark />
        <div className="mt-5">
          <Wordmark />
        </div>
        <p className="mt-4 text-center font-serif text-lg italic text-secondary">The door you already know.</p>
      </header>
      <form
        className="mt-8 flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (!email.includes("@") || password.length < 4) {
            setError("Use an email and a password of at least 4 characters.");
            return;
          }
          if (!adult) {
            setError("Confirm you are 18 or older.");
            return;
          }
          confirmAge();
          void navigate({ to: name ? "/home" : "/join" });
        }}
      >
        <Field label="Email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@email.com" />
        <Field label="Password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" />
        <label className="flex items-start gap-3 text-sm text-secondary">
          <input type="checkbox" checked={adult} onChange={(event) => setAdult(event.target.checked)} className="mt-1 size-4" />
          I am 18 or older.
        </label>
        {error ? <p className="text-sm text-secondary">{error}</p> : null}
        <Button type="submit" full>
          Sign in
        </Button>
        <p className="text-center text-xs text-muted">A preview door. Your password is not stored or sent.</p>
      </form>
      <div className="pb-safe mt-auto flex justify-center gap-4 py-6 text-sm text-secondary">
        <a href="/terms">Terms</a>
        <a href="/privacy">Privacy</a>
      </div>
    </main>
  );
}
