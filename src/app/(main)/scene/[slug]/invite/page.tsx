import { notFound } from "next/navigation";
import { Avatar } from "@/components/brand";
import { invitePerson } from "@/lib/actions";
import { BackHeader } from "@/components/shell";
import { requireUser } from "@/lib/auth";
import { getScene, listPeople } from "@/lib/data";

export default async function InvitePage({ params }: { params: Promise<{ slug: string }> }) {
  const user = await requireUser();
  const scene = await getScene((await params).slug);
  if (!scene) notFound();
  const people = await listPeople(user.id);
  return (
    <main className="px-4 pt-2">
      <BackHeader back={`/scene/${scene.slug}?tab=people`} />
      <h1 className="mt-4 text-3xl font-extrabold">Invite People</h1>
      <div className="mt-4 space-y-3">
        {people.map((person) => (
          <form key={person.id} action={invitePerson.bind(null, scene.slug, person.id)} className="flex items-center gap-3">
            <Avatar username={person.username} size={40} />
            <span className="flex-1 font-bold">{person.displayName}</span>
            <button className="rounded-full border border-[#ff7a00] px-3 py-1 text-sm font-bold">Invite</button>
          </form>
        ))}
      </div>
    </main>
  );
}
