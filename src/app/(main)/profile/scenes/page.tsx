import Link from "next/link";
import { BackHeader } from "@/components/shell";
import { requireUser } from "@/lib/auth";
import { myScenes } from "@/lib/data";

export default async function MyScenesPage() {
  const user = await requireUser();
  const scenes = await myScenes(user.id);
  return (
    <main className="px-4 pt-2">
      <BackHeader back="/profile" />
      <h1 className="mt-4 text-3xl font-extrabold">My Scenes</h1>
      <div className="mt-4 space-y-2">
        {scenes.map((scene) => (
          <Link key={scene.id} href={`/scene/${scene.slug}`} className="card block rounded-2xl px-3 py-3">
            <p className="font-bold">{scene.title}</p>
            <p className="text-xs text-zinc-400">{scene.isLive ? "Live" : "Quiet"} · {scene.category}</p>
          </Link>
        ))}
        {scenes.length === 0 ? <p className="text-sm text-zinc-400">Join a scene and it will show up here.</p> : null}
      </div>
    </main>
  );
}
