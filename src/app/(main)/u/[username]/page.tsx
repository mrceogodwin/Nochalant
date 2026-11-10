import { notFound } from "next/navigation";
import { Avatar } from "@/components/brand";
import { FollowButton } from "@/components/forms";
import { BackHeader } from "@/components/shell";
import { requireUser } from "@/lib/auth";
import { getPerson } from "@/lib/data";
import { compact } from "@/lib/format";

export default async function PersonPage({ params }: { params: Promise<{ username: string }> }) {
  const user = await requireUser();
  const person = await getPerson((await params).username, user.id);
  if (!person) notFound();
  const mine = person.id === user.id;
  return (
    <main className="px-4 pt-2">
      <BackHeader back="/discover" />
      <div className="mt-4 flex items-center gap-3">
        <Avatar username={person.username} src={person.avatarUrl} size={72} mascot={person.username === "blaqsoul"} />
        <div>
          <h1 className="text-2xl font-extrabold">
            {person.displayName} {person.verified ? <span className="text-[#ff9a3c]">✓</span> : null}
          </h1>
          <p className="text-zinc-400">@{person.username}</p>
        </div>
      </div>
      <p className="mt-3 text-sm text-zinc-300">{person.bio}</p>
      <p className="text-sm text-zinc-500">{person.location}</p>
      <div className="mt-4 grid grid-cols-3 text-center">
        <div><p className="font-extrabold">{compact(person.postsCount)}</p><p className="text-xs text-zinc-400">Posts</p></div>
        <div><p className="font-extrabold">{compact(person.followersCount)}</p><p className="text-xs text-zinc-400">Followers</p></div>
        <div><p className="font-extrabold">{compact(person.followingCount)}</p><p className="text-xs text-zinc-400">Following</p></div>
      </div>
      {!mine ? (
        <div className="mt-4">
          <FollowButton userId={person.id} following={person.following} />
        </div>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-2">
        {person.interests.map((interest) => (
          <span key={interest} className="rounded-full bg-white/5 px-3 py-1 text-xs">{interest}</span>
        ))}
      </div>
    </main>
  );
}
