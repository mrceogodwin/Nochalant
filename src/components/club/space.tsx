import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Collectible } from "@/components/club/objects";
import { ClubPage } from "@/components/club/page";
import { Button } from "@/components/club/ui";
import { findSpace, memberById, spaces, type SpaceKind } from "@/lib/club/data";
import { useClub } from "@/lib/club/store";
import type { ChatMessage } from "@/lib/club/types";

const emptyMessages: ChatMessage[] = [];

const backTo = {
  room: "/rooms",
  squad: "/squads",
  group: "/groups",
  experiment: "/experiments",
} as const;

export function SpaceList({ kind, title, kicker }: { kind: SpaceKind; title: string; kicker: string }) {
  const items = spaces(kind);
  return (
    <ClubPage title={title} kicker={kicker}>
      <div className="flex flex-col gap-3">
        {items.map((item) => (
          <Link
            key={item.id}
            to={kind === "room" ? "/rooms/$id" : kind === "squad" ? "/squads/$id" : kind === "group" ? "/groups/$id" : "/experiments/$id"}
            params={{ id: item.id }}
            className="flex items-center gap-3 rounded-3xl border border-line p-3"
          >
            <span className="w-14 shrink-0">
              <Collectible id={item.object} />
            </span>
            <span className="min-w-0">
              <span className="block font-semibold">{item.name}</span>
              <span className="block text-sm text-secondary">{item.blurb}</span>
              <span className="mt-1 block text-xs text-muted">{item.meta}</span>
            </span>
          </Link>
        ))}
      </div>
    </ClubPage>
  );
}

export function SpaceDetail({ kind, id }: { kind: SpaceKind; id: string }) {
  const space = findSpace(kind, id);
  const joined = useClub((state) => state.joined);
  const joinThing = useClub((state) => state.joinThing);
  const messages = useClub((state) => state.messages[id] ?? emptyMessages);
  const sendMessage = useClub((state) => state.sendMessage);
  const [text, setText] = useState("");
  const inIt = joined.includes(id);

  if (!space) {
    return (
      <ClubPage title="Not in the Club" back={backTo[kind]} tabs={false}>
        <p className="text-secondary">That door isn't open.</p>
      </ClubPage>
    );
  }

  return (
    <ClubPage title={space.name} kicker={space.meta} back={backTo[kind]} tabs={false}>
      <div className="flex items-start gap-3">
        <span className="w-20 shrink-0">
          <Collectible id={space.object} />
        </span>
        <p className="text-secondary">{space.blurb}</p>
      </div>
      {space.rules ? (
        <ul className="mt-4 flex list-disc flex-col gap-2 pl-5 text-sm text-secondary">
          {space.rules.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ul>
      ) : null}
      {space.members.length ? (
        <div className="mt-5">
          <h2 className="font-display text-lg font-semibold">In here</h2>
          <div className="mt-2 flex flex-col gap-2">
            {space.members.map((memberId) => {
              const member = memberById(memberId);
              if (!member) return null;
              return (
                <Link key={member.id} to="/people/$handle" params={{ handle: member.handle }} className="flex items-center gap-3">
                  <span className="w-10">
                    <Collectible id={member.object} />
                  </span>
                  <span className="text-sm font-medium">{member.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      ) : null}
      <Button
        full
        className="mt-5"
        onClick={() => {
          joinThing(id);
          toast(inIt ? "You're already in" : "You're in");
        }}
      >
        {inIt ? "You're in" : kind === "squad" ? "Request to join" : "Join"}
      </Button>
      {kind !== "experiment" ? (
        <div className="mt-6">
          <h2 className="font-display text-lg font-semibold">The thread</h2>
          <ul className="mt-3 flex flex-col gap-2">
            {messages.length === 0 ? <li className="text-sm text-secondary">Quiet. Say the first thing.</li> : null}
            {messages.map((message) => (
              <li key={message.id} className={message.from === "me" ? "ml-8 rounded-2xl bg-paper px-3 py-2 text-sm text-ink" : "mr-8 rounded-2xl bg-card px-3 py-2 text-sm"}>
                {message.text}
              </li>
            ))}
          </ul>
          <form
            className="mt-3 flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              const next = text.trim();
              if (!next) return;
              sendMessage(id, { text: next });
              setText("");
            }}
          >
            <input
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="Say it in the room"
              className="h-12 flex-1 rounded-full border border-line bg-card px-4 text-sm outline-none"
            />
            <Button type="submit">Send</Button>
          </form>
        </div>
      ) : null}
    </ClubPage>
  );
}
