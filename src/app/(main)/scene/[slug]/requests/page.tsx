import { notFound } from "next/navigation";
import { Avatar } from "@/components/brand";
import { decideSpeak } from "@/lib/actions";
import { BackHeader } from "@/components/shell";
import { requireUser } from "@/lib/auth";
import { getScene, speakRequests } from "@/lib/data";

export default async function RequestsPage({ params }: { params: Promise<{ slug: string }> }) {
  const user = await requireUser();
  const scene = await getScene((await params).slug);
  if (!scene) notFound();
  const requests = await speakRequests(scene.id);
  const host = scene.hostUsername === user.username;
  return (
    <main className="px-4 pt-2">
      <BackHeader back={`/scene/${scene.slug}?tab=people`} />
      <h1 className="mt-4 text-3xl font-extrabold">Requests to Speak</h1>
      <div className="mt-4 space-y-3">
        {requests.map((request) => (
          <div key={request.id} className="flex items-center gap-3">
            <Avatar username={request.username} size={40} />
            <span className="flex-1 font-bold">{request.displayName}</span>
            {host ? (
              <>
                <form action={decideSpeak.bind(null, request.id, scene.slug, true)}><button className="text-sm font-bold text-[#ffb000]">Accept</button></form>
                <form action={decideSpeak.bind(null, request.id, scene.slug, false)}><button className="text-sm text-zinc-400">Decline</button></form>
              </>
            ) : null}
          </div>
        ))}
        {requests.length === 0 ? <p className="text-sm text-zinc-400">No one is waiting.</p> : null}
      </div>
    </main>
  );
}
