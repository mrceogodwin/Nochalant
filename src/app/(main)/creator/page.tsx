import Link from "next/link";
import { BackHeader } from "@/components/shell";
import { requireUser } from "@/lib/auth";
import { myScenes } from "@/lib/data";

export default async function CreatorPage() {
  const user = await requireUser();
  const scenes = await myScenes(user.id);
  return (
    <main className="px-4 pt-2">
      <BackHeader back="/profile" />
      <h1 className="mt-4 text-3xl font-extrabold">Creator Tools</h1>
      <p className="mt-2 text-sm text-zinc-300">Host, manage and grow your community. Pro adds rooms up to 5,000 and creator insights.</p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <Stat label="Scenes" value={String(scenes.length)} />
        <Stat label="Followers" value={user.followersCount.toLocaleString("en-US")} />
        <Stat label="Posts" value={String(user.postsCount)} />
        <Stat label="Gifts sent" value={`₦${user.giftTotal.toLocaleString("en-NG")}`} />
      </div>
      <Link href="/create" className="orange-fill mt-5 flex h-12 items-center justify-center rounded-full font-bold">Create a Scene</Link>
      <Link href="/events" className="mt-3 flex h-12 items-center justify-center rounded-full border border-white/15 font-bold">Plan an event</Link>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card rounded-2xl p-3">
      <p className="text-xs text-zinc-400">{label}</p>
      <p className="text-xl font-extrabold">{value}</p>
    </div>
  );
}
