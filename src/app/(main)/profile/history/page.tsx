import Link from "next/link";
import { BackHeader } from "@/components/shell";
import { requireUser } from "@/lib/auth";
import { sceneHistory } from "@/lib/data";

export default async function HistoryPage() {
  const user = await requireUser();
  const scenes = await sceneHistory(user.id);
  return (
    <main className="px-4 pt-2">
      <BackHeader back="/profile" />
      <h1 className="mt-4 text-3xl font-extrabold">History</h1>
      <div className="mt-4 space-y-2">
        {scenes.map((scene) => (
          <Link key={scene.id} href={`/scene/${scene.slug}`} className="card block rounded-2xl px-3 py-3 font-bold">{scene.title}</Link>
        ))}
        {scenes.length === 0 ? <p className="text-sm text-zinc-400">Scenes you open are remembered here.</p> : null}
      </div>
    </main>
  );
}
