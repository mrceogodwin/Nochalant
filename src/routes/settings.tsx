import { createFileRoute, Link } from "@tanstack/react-router";
import * as Switch from "@radix-ui/react-switch";
import { ClubPage } from "@/components/club/page";
import { memberById } from "@/lib/club/data";
import { useClub } from "@/lib/club/store";

export const Route = createFileRoute("/settings")({ component: Settings });

function Settings() {
  const isPrivate = useClub((state) => state.isPrivate);
  const setPrivate = useClub((state) => state.setPrivate);
  const blocked = useClub((state) => state.blocked);
  const unblock = useClub((state) => state.unblock);
  const reset = useClub((state) => state.reset);

  return (
    <ClubPage title="Settings" kicker="Your door" back="/my-club" tabs={false}>
      <label className="flex items-center justify-between gap-4 rounded-2xl border border-line px-4 py-3">
        <span>
          <span className="block text-sm font-medium">Private profile</span>
          <span className="block text-xs text-muted">People request to follow.</span>
        </span>
        <Switch.Root
          checked={isPrivate}
          onCheckedChange={setPrivate}
          className="relative h-7 w-12 shrink-0 rounded-full bg-line data-[state=checked]:bg-paper"
          aria-label="Private profile"
        >
          <Switch.Thumb className="block size-6 translate-x-0.5 rounded-full bg-fg transition data-[state=checked]:translate-x-5 data-[state=checked]:bg-ink" />
        </Switch.Root>
      </label>
      <h2 className="mt-6 font-display text-lg font-semibold">Blocked</h2>
      {blocked.length === 0 ? <p className="mt-2 text-sm text-secondary">No one is blocked.</p> : null}
      <ul className="mt-2 flex flex-col gap-2">
        {blocked.map((id) => (
          <li key={id} className="flex items-center justify-between text-sm">
            <span>{memberById(id)?.name ?? id}</span>
            <button type="button" className="text-secondary underline" onClick={() => unblock(id)}>
              Unblock
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-6 flex flex-col gap-2 text-sm text-secondary">
        <Link to="/terms" className="underline">Terms</Link>
        <Link to="/privacy" className="underline">Privacy</Link>
        <Link to="/guidelines" className="underline">Community guidelines</Link>
        <Link to="/age" className="underline">Age policy</Link>
        <Link to="/admin" className="underline">Club desk</Link>
        <button type="button" className="text-left underline" onClick={() => reset()}>
          Leave this preview
        </button>
      </div>
    </ClubPage>
  );
}
