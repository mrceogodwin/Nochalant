import Link from "next/link";
import { Avatar, Cover } from "@/components/brand";
import { BackHeader } from "@/components/shell";
import { publicScenes } from "@/lib/data";
import { compact } from "@/lib/format";

export default async function ExplorePage() {
  const scenes = await publicScenes();
  return (
    <main className="min-h-dvh px-4 pb-24">
      <BackHeader back="/" />
      <h1 className="mt-4 text-3xl font-extrabold">Public Scenes</h1>
      <p className="mb-4 text-sm text-zinc-400">Listen in. Sign in when you want to speak.</p>
      <div className="space-y-3">
        {scenes.map((scene) => (
          <Link key={scene.id} href={`/signin?next=/scene/${scene.slug}`} className="card flex items-center gap-3 rounded-3xl p-3">
            <span className="grid h-16 w-16 place-items-center overflow-hidden rounded-2xl bg-orange-950/40">
              {scene.coverKey.startsWith("cast") ? <Avatar username={scene.hostUsername} size={64} /> : <Cover kind={scene.coverKey} className="h-14 w-14" />}
            </span>
            <span className="flex-1">
              <span className="block font-bold">{scene.title}</span>
              <span className="block text-sm text-zinc-400">
                {scene.isLive ? "LIVE · " : ""}
                {compact(scene.listenerCount)} listening
              </span>
            </span>
          </Link>
        ))}
      </div>
    </main>
  );
}
