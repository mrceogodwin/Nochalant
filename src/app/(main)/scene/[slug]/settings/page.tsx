import { notFound } from "next/navigation";
import { updateScene } from "@/lib/actions";
import { BackHeader } from "@/components/shell";
import { requireUser } from "@/lib/auth";
import { getScene } from "@/lib/data";

export default async function SettingsPage({ params }: { params: Promise<{ slug: string }> }) {
  const user = await requireUser();
  const scene = await getScene((await params).slug);
  if (!scene) notFound();
  const host = scene.hostUsername === user.username;
  return (
    <main className="px-4 pt-2">
      <BackHeader back={`/scene/${scene.slug}?tab=people`} />
      <h1 className="mt-4 text-3xl font-extrabold">Room Settings</h1>
      <form action={updateScene.bind(null, scene.slug)} className="mt-4 space-y-3">
        <input name="title" defaultValue={scene.title} disabled={!host} className="field h-12 w-full rounded-full px-4" />
        <textarea name="description" defaultValue={scene.description} disabled={!host} className="field min-h-24 w-full rounded-3xl px-4 py-3" />
        <label className="flex items-center justify-between"><span>Private Scene</span><input type="checkbox" name="isPrivate" defaultChecked={scene.isPrivate} disabled={!host} /></label>
        <label className="flex items-center justify-between"><span>18+</span><input type="checkbox" name="isAdult" defaultChecked={scene.isAdult} disabled={!host} /></label>
        {host ? <button className="orange-fill h-12 w-full rounded-full font-bold">Save</button> : <p className="text-sm text-zinc-400">Only the host can change these.</p>}
      </form>
    </main>
  );
}
