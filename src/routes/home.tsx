import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Collectible } from "@/components/club/objects";
import { Feed } from "@/components/club/feed";
import { ClubFrame } from "@/components/club/shell";
import { members } from "@/lib/club/data";
import { useClub } from "@/lib/club/store";
import { cn, greeting } from "@/lib/utils";

export const Route = createFileRoute("/home")({ component: HomeScreen });

const filters = [
  { id: "foryou", label: "For you" },
  { id: "following", label: "Following" },
  { id: "friends", label: "Friends" },
  { id: "voice", label: "Voice" },
  { id: "trending", label: "Trending" },
] as const;

function HomeScreen() {
  const name = useClub((state) => state.name);
  const [filter, setFilter] = useState<(typeof filters)[number]["id"]>("foryou");
  const first = name.trim().split(" ")[0];

  return (
    <ClubFrame
      kicker={greeting()}
      title={first || "Welcome in"}
      rail={
        <div>
          <p className="text-xs tracking-widest text-muted">AROUND TONIGHT</p>
          <ul className="mt-3 flex flex-col gap-3">
            {members.slice(0, 5).map((member) => (
              <li key={member.id} className="flex items-center gap-3">
                <span className="w-10">
                  <Collectible id={member.object} />
                </span>
                <span>
                  <span className="block text-sm font-medium">{member.name}</span>
                  <span className="block text-xs text-muted">{member.personality}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      }
    >
      <div className="flex gap-4 overflow-x-auto border-b border-line px-4 py-3">
        {members.slice(0, 6).map((member) => (
          <Link key={member.id} to="/people/$handle" params={{ handle: member.handle }} className="flex w-16 shrink-0 flex-col items-center gap-1">
            <span className="w-14">
              <Collectible id={member.object} />
            </span>
            <span className="w-full truncate text-center text-xs text-secondary">{member.name}</span>
          </Link>
        ))}
      </div>
      <div className="flex gap-2 overflow-x-auto px-4 py-3">
        {filters.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFilter(item.id)}
            className={cn(
              "h-9 shrink-0 rounded-full px-4 text-sm",
              filter === item.id ? "bg-paper font-semibold text-ink" : "bg-elevated text-secondary",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>
      <Feed filter={filter} />
    </ClubFrame>
  );
}
