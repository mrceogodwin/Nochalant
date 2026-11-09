import { createFileRoute, Link } from "@tanstack/react-router";
import { Collectible } from "@/components/club/objects";
import { ClubPage } from "@/components/club/page";
import { memberById, sceneInsiders } from "@/lib/club/data";
import { useClub } from "@/lib/club/store";

export const Route = createFileRoute("/followers")({ component: Followers });

function PersonRow({ id }: { id: string }) {
  const member = memberById(id);
  if (!member) return null;
  return (
    <Link to="/people/$handle" params={{ handle: member.handle }} className="flex items-center gap-3">
      <span className="w-12">
        <Collectible id={member.object} />
      </span>
      <span>
        <span className="block font-semibold">{member.name}</span>
        <span className="block text-xs text-muted">{member.personality}</span>
      </span>
    </Link>
  );
}

function Followers() {
  const isPrivate = useClub((state) => state.isPrivate);
  const asks = useClub((state) => state.asks);
  const letIn = useClub((state) => state.letIn);
  const decideAsk = useClub((state) => state.decideAsk);
  const insiders = [...new Set([...sceneInsiders, ...letIn])];

  return (
    <ClubPage title="Followers" kicker="In this scene" back="/my-club" tabs={false}>
      <p className="text-sm text-secondary">
        Adaeze, June and Idris already know you here. That is the scene, not a live follower count.
      </p>
      <ul className="mt-4 flex flex-col gap-3">
        {insiders.map((id) => (
          <li key={id}>
            <PersonRow id={id} />
          </li>
        ))}
      </ul>
      <h2 className="mt-8 font-display text-xl font-semibold">Knocking</h2>
      {isPrivate ? (
        asks.length === 0 ? (
          <p className="mt-2 text-sm text-secondary">No one is waiting at the door.</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-3">
            {asks.map((id) => {
              const member = memberById(id);
              if (!member) return null;
              return (
                <li key={id} className="rounded-3xl border border-line p-3">
                  <PersonRow id={id} />
                  <div className="mt-3 flex gap-2">
                    <button type="button" onClick={() => decideAsk(id, true)} className="h-10 flex-1 rounded-full bg-paper text-sm font-semibold text-ink">
                      Let in
                    </button>
                    <button type="button" onClick={() => decideAsk(id, false)} className="h-10 flex-1 rounded-full border border-line text-sm">
                      Not now
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )
      ) : (
        <p className="mt-2 text-sm text-secondary">
          Your profile is open, so nobody has to knock. <Link to="/settings" className="underline">Turn on private</Link> if you want a door.
        </p>
      )}
    </ClubPage>
  );
}
