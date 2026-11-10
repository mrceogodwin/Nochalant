import Link from "next/link";
import { BackHeader } from "@/components/shell";
import { requireUser } from "@/lib/auth";
import { activityFor } from "@/lib/data";
import { relativeTime } from "@/lib/format";

export default async function ActivityPage() {
  const user = await requireUser();
  const items = await activityFor(user.id);
  return (
    <main className="px-4 pt-2">
      <BackHeader back="/profile" />
      <h1 className="mt-4 text-3xl font-extrabold">My Activity</h1>
      <div className="mt-4 space-y-2">
        {items.map((item) => (
          <Link key={item.id} href={item.href || "/home"} className="card block rounded-2xl px-3 py-3">
            <p className="font-bold">{item.title}</p>
            <p className="text-sm text-zinc-400">{item.body}</p>
            <p className="text-xs text-zinc-500">{relativeTime(item.createdAt)}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
