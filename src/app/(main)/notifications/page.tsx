import Link from "next/link";
import { markNotesRead } from "@/lib/actions";
import { BackHeader } from "@/components/shell";
import { requireUser } from "@/lib/auth";
import { notifications } from "@/lib/data";
import { relativeTime } from "@/lib/format";

export default async function NotificationsPage() {
  const user = await requireUser();
  const notes = await notifications(user.id);
  return (
    <main className="px-4 pt-2">
      <BackHeader back="/home" />
      <div className="mt-4 flex items-center justify-between">
        <h1 className="text-3xl font-extrabold">Notifications</h1>
        <form action={markNotesRead}><button className="text-sm font-bold text-[#ff7a00]">Mark read</button></form>
      </div>
      <div className="mt-4 space-y-2">
        {notes.map((note) => (
          <Link key={note.id} href={note.href || "/home"} className={`block rounded-2xl px-3 py-3 ${note.read ? "bg-white/5" : "card"}`}>
            <p className="font-bold">{note.title}</p>
            <p className="text-sm text-zinc-300">{note.body}</p>
            <p className="text-xs text-zinc-500">{relativeTime(note.createdAt)}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
