import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { Collectible } from "@/components/club/objects";
import { ClubFrame } from "@/components/club/shell";
import { experiments, groups, members, rooms, squads } from "@/lib/club/data";
import { useClub } from "@/lib/club/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/discover")({ component: DiscoverScreen });

function DiscoverScreen() {
  const [query, setQuery] = useState("");
  const following = useClub((state) => state.following);
  const toggleFollow = useClub((state) => state.toggleFollow);
  const blocked = useClub((state) => state.blocked);
  const block = useClub((state) => state.block);
  const needle = query.trim().toLowerCase();

  const people = useMemo(
    () =>
      members.filter(
        (member) =>
          !blocked.includes(member.id) &&
          (!needle || `${member.name} ${member.personality} ${member.line}`.toLowerCase().includes(needle)),
      ),
    [blocked, needle],
  );
  const roomHits = rooms.filter((room) => !needle || room.name.toLowerCase().includes(needle));
  const groupHits = groups.filter((group) => !needle || `${group.name} ${group.blurb}`.toLowerCase().includes(needle));
  const squadHits = squads.filter((squad) => !needle || `${squad.name} ${squad.blurb}`.toLowerCase().includes(needle));
  const experimentHits = experiments.filter((item) => !needle || item.title.toLowerCase().includes(needle));
  const doors = [
    { to: "/voice", label: "Voice" },
    { to: "/rooms", label: "Rooms" },
    { to: "/groups", label: "Groups" },
    { to: "/squads", label: "Squads" },
    { to: "/experiments", label: "Experiments" },
    { to: "/polls", label: "Polls" },
    { to: "/gifts", label: "Gifts" },
    { to: "/emoji", label: "Emoji" },
    { to: "/leaders", label: "Leaders" },
    { to: "/challenges", label: "Challenges" },
    { to: "/table", label: "The Table" },
  ] as const;

  return (
    <ClubFrame>
      <header className="px-4 pt-3">
        <label className="flex h-12 items-center gap-2 rounded-full border border-line bg-card px-4">
          <Search className="size-4 text-muted" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="People, rooms, experiments"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted"
          />
        </label>
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {doors.map((door) => (
            <Link key={door.to} to={door.to} className="h-9 shrink-0 rounded-full bg-elevated px-4 py-2 text-sm text-secondary">
              {door.label}
            </Link>
          ))}
        </div>
      </header>
      <section className="mt-6 px-4">
        <div className="flex items-end justify-between">
          <h2 className="font-display text-xl font-semibold">Chatmates</h2>
          <Link to="/circle" className="text-sm text-secondary">
            See the door
          </Link>
        </div>
        {people.length === 0 ? <p className="mt-3 text-sm text-secondary">Nothing under that name.</p> : null}
        <div className="mt-3 flex flex-col gap-3">
          {people.map((member) => {
            const on = following.includes(member.id);
            return (
              <div key={member.id} className="flex items-center gap-3">
                <span className="w-14 shrink-0">
                  <Collectible id={member.object} />
                </span>
                <Link to="/people/$handle" params={{ handle: member.handle }} className="min-w-0 flex-1">
                  <p className="font-semibold">{member.name}</p>
                  <p className="text-xs text-muted">{member.personality}</p>
                  <p className="truncate text-sm text-secondary">{member.line}</p>
                </Link>
                <button
                  type="button"
                  onClick={() => toggleFollow(member.id)}
                  className={cn("h-10 rounded-full px-3 text-sm font-semibold", on ? "border border-line" : "bg-paper text-ink")}
                >
                  {on ? "Following" : "Follow"}
                </button>
                <button
                  type="button"
                  className="text-xs text-muted"
                  onClick={() => {
                    block(member.id);
                    toast(`${member.name} is blocked on this device`);
                  }}
                >
                  Block
                </button>
              </div>
            );
          })}
        </div>
      </section>
      <section className="mt-8 px-4">
        <div className="flex items-end justify-between">
          <h2 className="font-display text-xl font-semibold">Rooms</h2>
          <Link to="/rooms" className="text-sm text-secondary">All</Link>
        </div>
        <div className="mt-3 flex gap-3 overflow-x-auto">
          {roomHits.map((room) => (
            <Link key={room.id} to="/rooms/$id" params={{ id: room.id }} className="w-44 shrink-0 rounded-3xl border border-line p-3">
              <span className="block w-14">
                <Collectible id={room.object} />
              </span>
              <p className="mt-2 font-semibold">{room.name}</p>
              <p className="text-xs text-muted">{room.members.length} in the scene</p>
            </Link>
          ))}
        </div>
      </section>
      <section className="mt-8 px-4">
        <div className="flex items-end justify-between">
          <h2 className="font-display text-xl font-semibold">Groups</h2>
          <Link to="/groups" className="text-sm text-secondary">All</Link>
        </div>
        {groupHits.map((group) => (
          <Link key={group.id} to="/groups/$id" params={{ id: group.id }} className="mt-3 flex items-center gap-3">
            <span className="w-12">
              <Collectible id={group.object} />
            </span>
            <span>
              <span className="block font-semibold">{group.name}</span>
              <span className="block text-xs text-muted">{group.blurb}</span>
            </span>
          </Link>
        ))}
      </section>
      <section className="mt-8 px-4">
        <div className="flex items-end justify-between">
          <h2 className="font-display text-xl font-semibold">Squads</h2>
          <Link to="/squads" className="text-sm text-secondary">All</Link>
        </div>
        {squadHits.map((squad) => (
          <Link key={squad.id} to="/squads/$id" params={{ id: squad.id }} className="mt-3 flex items-center gap-3">
            <span className="w-12">
              <Collectible id={squad.object} />
            </span>
            <span>
              <span className="block font-semibold">{squad.name}</span>
              <span className="block text-xs text-muted">{squad.access}</span>
            </span>
          </Link>
        ))}
      </section>
      <section className="mt-8 px-4 pb-6">
        <div className="flex items-end justify-between">
          <h2 className="font-display text-xl font-semibold">Experiments</h2>
          <Link to="/experiments" className="text-sm text-secondary">All</Link>
        </div>
        <div className="mt-3 flex flex-col gap-3">
          {experimentHits.map((item) => (
            <Link key={item.id} to="/experiments/$id" params={{ id: item.id }} className="flex items-center gap-3 rounded-3xl border border-line p-3">
              <span className="w-14 shrink-0">
                <Collectible id={item.object} />
              </span>
              <span>
                <span className="block font-semibold">{item.title}</span>
                <span className="block text-sm text-secondary">{item.blurb}</span>
                <span className="mt-1 block text-xs text-muted">{item.duration}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>
    </ClubFrame>
  );
}
