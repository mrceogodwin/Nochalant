import { createFileRoute, Link } from "@tanstack/react-router";
import { Collectible } from "@/components/club/objects";
import { ClubFrame } from "@/components/club/shell";
import { memberById, threads } from "@/lib/club/data";
import { useClub } from "@/lib/club/store";

export const Route = createFileRoute("/chats/")({ component: ChatsScreen });

function ChatsScreen() {
  const messages = useClub((state) => state.messages);
  const known = new Set(threads.map((thread) => thread.id));
  const extra = Object.keys(messages)
    .filter((id) => !known.has(id) && (messages[id]?.length ?? 0) > 0)
    .map((id) => {
      const member = memberById(id);
      return {
        id,
        title: member?.name ?? "Conversation",
        object: member?.object ?? "bubble",
        time: "",
      } as const;
    });
  const list = [...threads, ...extra];

  return (
    <ClubFrame>
      <header className="px-4 pt-3">
        <p className="text-sm text-secondary">Requests stay separate from the people you already know.</p>
      </header>
      <div className="mt-3 flex gap-2 px-4">
        <span className="rounded-full bg-paper px-4 py-2 text-sm font-semibold text-ink">Inbox</span>
        <Link to="/chats/requests" className="rounded-full bg-elevated px-4 py-2 text-sm text-secondary">
          Requests
        </Link>
      </div>
      <ul className="mt-4">
        {list.map((thread) => {
          const last = messages[thread.id]?.at(-1);
          return (
            <li key={thread.id} className="border-b border-line">
              <Link to="/chats/$id" params={{ id: thread.id }} className="flex items-center gap-3 px-4 py-3">
                <span className="w-14 shrink-0">
                  <Collectible id={thread.object} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="font-semibold">{thread.title}</span>
                    <span className="text-xs text-muted">{last?.at ?? thread.time}</span>
                  </span>
                  <span className="block truncate text-sm text-secondary">
                    {last?.text ?? (last?.object ? "Sent an object" : "Say something")}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </ClubFrame>
  );
}
