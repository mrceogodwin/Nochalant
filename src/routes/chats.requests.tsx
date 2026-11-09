import { createFileRoute } from "@tanstack/react-router";
import { Collectible } from "@/components/club/objects";
import { ClubFrame } from "@/components/club/shell";
import { members } from "@/lib/club/data";
import { useClub } from "@/lib/club/store";

export const Route = createFileRoute("/chats/requests")({ component: RequestsScreen });

function RequestsScreen() {
  const greeted = useClub((state) => state.greeted);
  const waiting = members.filter((member) => ["kelechi", "sable"].includes(member.id) && !greeted.includes(member.id));

  return (
    <ClubFrame tabs={false} title="Requests" kicker="Before they reach your inbox" back="/chats">
      {waiting.length === 0 ? (
        <p className="px-5 py-10 text-secondary">No one is waiting. Message requests land here before they reach your inbox.</p>
      ) : (
        <ul className="mt-4 flex flex-col gap-3 px-4">
          {waiting.map((member) => (
            <li key={member.id} className="flex items-center gap-3 rounded-3xl border border-line p-3">
              <span className="w-12">
                <Collectible id={member.object} />
              </span>
              <div>
                <p className="font-semibold">{member.name}</p>
                <p className="text-sm text-secondary">Wants to say something. You haven't opened the door.</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </ClubFrame>
  );
}
