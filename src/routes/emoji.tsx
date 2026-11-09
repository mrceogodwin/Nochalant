import { createFileRoute } from "@tanstack/react-router";
import { Collectible } from "@/components/club/objects";
import { ClubPage } from "@/components/club/page";
import { collectibleNames, emojiGroups } from "@/lib/club/data";
import { useClub } from "@/lib/club/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/emoji")({ component: Emoji });

function Emoji() {
  const favourites = useClub((state) => state.favourites);
  const toggleFavourite = useClub((state) => state.toggleFavourite);

  return (
    <ClubPage title="Emoji" kicker="Opening collection">
      <p className="text-sm text-secondary">
        Tap an object to keep it. This is the first cast, not the full hundred. Favourites stay on this device.
      </p>
      {favourites.length ? (
        <div className="mt-4 flex gap-2 overflow-x-auto">
          {favourites.map((id) => (
            <span key={id} className="w-14 shrink-0">
              <Collectible id={id} />
            </span>
          ))}
        </div>
      ) : null}
      {emojiGroups.map((group) => (
        <section key={group.name} className="mt-6">
          <h2 className="font-display text-lg font-semibold">{group.name}</h2>
          <div className="mt-2 grid grid-cols-4 gap-2">
            {group.ids.map((id) => {
              const on = favourites.includes(id);
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => toggleFavourite(id)}
                  className={cn("rounded-2xl border p-1", on ? "border-paper" : "border-line")}
                >
                  <Collectible id={id} />
                  <span className="mt-1 block text-center text-xs">{collectibleNames[id]}</span>
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </ClubPage>
  );
}
