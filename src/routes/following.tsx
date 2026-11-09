import { createFileRoute, Link } from "@tanstack/react-router";
import { Collectible } from "@/components/club/objects";
import { ClubPage } from "@/components/club/page";
import { members } from "@/lib/club/data";
import { useClub } from "@/lib/club/store";

export const Route = createFileRoute("/following")({ component: Following });

function Following() {
  const ids = useClub((state) => state.following);
  const people = members.filter((member) => ids.includes(member.id));

  return (
    <ClubPage title="Following" kicker="Your circle" back="/my-club" tabs={false}>
      {people.length === 0 ? (
        <p className="text-secondary">
          Nobody yet. <Link to="/discover" className="underline">Find people</Link>.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {people.map((member) => (
            <li key={member.id}>
              <Link to="/people/$handle" params={{ handle: member.handle }} className="flex items-center gap-3">
                <span className="w-12">
                  <Collectible id={member.object} />
                </span>
                <span>
                  <span className="block font-semibold">{member.name}</span>
                  <span className="block text-xs text-muted">{member.personality}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </ClubPage>
  );
}
