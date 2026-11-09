import { createFileRoute, Link } from "@tanstack/react-router";
import { Collectible } from "@/components/club/objects";
import { ClubPage } from "@/components/club/page";
import { challenges } from "@/lib/club/data";
import { useClub } from "@/lib/club/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/challenges")({ component: Challenges });

function Challenges() {
  const done = useClub((state) => state.challenges);
  const toggle = useClub((state) => state.toggleChallenge);

  return (
    <ClubPage title="Challenges" kicker="Optional" back="/discover" tabs={false}>
      <p className="text-sm text-secondary">Mark one when you have actually done it. Nothing here is scored against other people.</p>
      <ul className="mt-4 flex flex-col gap-3">
        {challenges.map((item) => {
          const on = done.includes(item.id);
          return (
            <li key={item.id} className="rounded-3xl border border-line p-3">
              <div className="flex items-center gap-3">
                <span className="w-14 shrink-0">
                  <Collectible id={item.object} />
                </span>
                <span className="min-w-0">
                  <span className="block font-semibold">{item.title}</span>
                  <span className="block text-sm text-secondary">{item.blurb}</span>
                </span>
              </div>
              <div className="mt-3 flex gap-2">
                <Link to={item.to} className="inline-flex h-10 flex-1 items-center justify-center rounded-full border border-line text-sm">
                  Open
                </Link>
                <button
                  type="button"
                  onClick={() => toggle(item.id)}
                  className={cn("h-10 flex-1 rounded-full text-sm font-semibold", on ? "bg-paper text-ink" : "bg-elevated")}
                >
                  {on ? "Done" : "Mark done"}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </ClubPage>
  );
}
