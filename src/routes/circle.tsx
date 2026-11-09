import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Collectible } from "@/components/club/objects";
import { Stage } from "@/components/club/stage";
import { Button } from "@/components/club/ui";
import { members, rooms, squads } from "@/lib/club/data";
import { useClub } from "@/lib/club/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/circle")({ component: CircleScreen });

function CircleScreen() {
  const greeted = useClub((state) => state.greeted);
  const toggleGreet = useClub((state) => state.toggleGreet);
  const toggleFollow = useClub((state) => state.toggleFollow);
  const following = useClub((state) => state.following);
  const navigate = useNavigate();
  const suggested = members.slice(0, 4);

  return (
    <Stage
      step={6}
      back="/identity"
      kicker="Your first room"
      title="Discover your people."
      subtitle="A few doors are already open. You don't have to walk through all of them."
      footer={
        <Button full onClick={() => void navigate({ to: "/home" })}>
          Enter the Club
        </Button>
      }
    >
      <div className="flex flex-col gap-3">
        {suggested.map((member) => {
          const sent = greeted.includes(member.id);
          return (
            <div key={member.id} className="flex items-center gap-3 rounded-3xl border border-line p-3">
              <span className="w-14 shrink-0">
                <Collectible id={member.object} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{member.name}</p>
                <p className="text-xs text-muted">{member.personality}</p>
                <p className="truncate text-sm text-secondary">{member.line}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  toggleGreet(member.id);
                  if (!following.includes(member.id)) toggleFollow(member.id);
                }}
                className={cn(
                  "h-10 rounded-full px-3 text-sm font-semibold",
                  sent ? "border border-line text-secondary" : "bg-paper text-ink",
                )}
              >
                {sent ? "Sent" : "Greet"}
              </button>
            </div>
          );
        })}
      </div>
      <h2 className="mt-6 font-display text-lg font-semibold">Rooms</h2>
      <div className="mt-2 flex gap-3 overflow-x-auto">
        {rooms.slice(0, 3).map((room) => (
          <div key={room.id} className="w-40 shrink-0 rounded-3xl border border-line p-3">
            <span className="block w-12">
              <Collectible id={room.object} />
            </span>
            <p className="mt-2 text-sm font-semibold">{room.name}</p>
            <p className="text-xs text-muted">{room.members.length} in the scene</p>
          </div>
        ))}
      </div>
      <h2 className="mt-6 font-display text-lg font-semibold">Squads</h2>
      {squads.map((squad) => (
        <div key={squad.id} className="mt-2 flex items-center gap-3">
          <span className="w-12">
            <Collectible id={squad.object} />
          </span>
          <div>
            <p className="text-sm font-semibold">{squad.name}</p>
            <p className="text-xs text-muted">{squad.access}</p>
          </div>
        </div>
      ))}
    </Stage>
  );
}
