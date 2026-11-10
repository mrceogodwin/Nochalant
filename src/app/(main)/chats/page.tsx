import Link from "next/link";
import { Search } from "lucide-react";
import { Avatar, Mascot } from "@/components/brand";
import { Logo, NotifyButton } from "@/components/shell";
import { requireUser } from "@/lib/auth";
import { invites, listChats, unreadNotes } from "@/lib/data";
import { chatStamp } from "@/lib/format";

const filters = [
  ["all", "All Chats"],
  ["groups", "Groups"],
  ["scenes", "Scenes"],
  ["requests", "Requests"],
];

export default async function ChatsPage({ searchParams }: { searchParams: Promise<{ filter?: string; q?: string }> }) {
  const user = await requireUser();
  const params = await searchParams;
  const filter = params.filter || "all";
  const q = (params.q || "").toLowerCase();
  const [threads, requests, notes] = await Promise.all([listChats(user.id), invites(user.id), unreadNotes(user.id)]);
  const visible = threads.filter((thread) => {
    if (q && !thread.title.toLowerCase().includes(q) && !thread.lastBody.toLowerCase().includes(q)) return false;
    if (filter === "groups") return thread.kind === "group";
    if (filter === "scenes") return thread.kind === "scene";
    if (filter === "requests") return false;
    return true;
  });
  const pending = requests.filter((invite) => invite.status === "pending");

  return (
    <main className="px-4 pt-4">
      <header className="grid grid-cols-[40px_1fr_72px] items-center">
        <Avatar username={user.username} src={user.avatarUrl} size={40} />
        <div className="flex justify-center">
          <Logo size="sm" />
        </div>
        <div className="flex justify-end">
          <NotifyButton dot={notes > 0} />
        </div>
      </header>
      <div className="mt-3 flex items-end justify-between">
        <div>
          <h1 className="text-4xl font-extrabold">Chats</h1>
          <p className="text-sm text-zinc-400">Your conversations, groups and Scenes.</p>
        </div>
        <Mascot size={78} />
      </div>
      <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
        {filters.map(([id, label]) => (
          <Link key={id} href={`/chats?filter=${id}`} className={`rounded-full px-3 py-2 text-sm font-bold ${filter === id ? "orange-fill text-black" : "bg-white/5"}`}>
            {label}
            {id === "all" && threads.some((thread) => thread.unread > 0) ? <span className="ml-1 rounded-full bg-[#ff3b30] px-1.5 text-[10px] text-white">{threads.filter((thread) => thread.unread > 0).length}</span> : null}
          </Link>
        ))}
      </div>
      <form className="mt-3" action="/chats">
        <input type="hidden" name="filter" value={filter} />
        <label className="field flex h-12 items-center gap-2 rounded-full px-4">
          <Search size={16} className="text-zinc-500" />
          <input name="q" defaultValue={params.q || ""} placeholder="Search chats, groups or people..." className="w-full bg-transparent outline-none" />
        </label>
      </form>
      <div className="mt-4 space-y-2">
        {filter === "requests"
          ? pending.map((invite) => (
              <Link key={invite.id} href="/invites" className="card block rounded-2xl p-3">
                <p className="font-bold">{invite.title}</p>
                <p className="text-sm text-zinc-400">{invite.body}</p>
              </Link>
            ))
          : visible.map((thread) => (
              <Link key={thread.id} href={`/chats/${thread.id}`} className={`flex items-center gap-3 rounded-2xl p-2 ${thread.pinned ? "bg-[#ff7a00]/10 ring-1 ring-[#ff7a00]/40" : ""}`}>
                <span className="grid h-12 w-12 place-items-center overflow-hidden rounded-full bg-zinc-900">
                  {thread.icon ? <span className="text-xl">{thread.icon}</span> : <Avatar username={thread.username || "godwin"} size={48} mascot />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate font-bold">{thread.title}</span>
                    <span className="text-[11px] text-zinc-500">{chatStamp(thread.lastAt)}</span>
                  </span>
                  <span className="block truncate text-sm text-zinc-400">{thread.lastBody}</span>
                </span>
                {thread.unread ? <span className="grid h-6 min-w-6 place-items-center rounded-full bg-[#ff7a00] px-1 text-xs font-bold text-black">{thread.unread}</span> : null}
              </Link>
            ))}
        {filter === "requests" && pending.length === 0 ? <p className="text-sm text-zinc-400">No open requests.</p> : null}
      </div>
      <Link href="/create" className="orange-fill fixed bottom-28 right-1/2 z-30 grid h-14 w-14 translate-x-[180px] place-items-center rounded-full text-2xl text-black" aria-label="New chat">
        ✎
      </Link>
    </main>
  );
}
