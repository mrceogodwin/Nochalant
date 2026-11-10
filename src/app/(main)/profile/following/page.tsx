import Link from "next/link";
import { Avatar } from "@/components/brand";
import { FollowButton } from "@/components/forms";
import { BackHeader } from "@/components/shell";
import { requireUser } from "@/lib/auth";
import { followingOf } from "@/lib/data";

export default async function FollowingPage() {
  const user = await requireUser();
  const people = await followingOf(user.id, user.id);
  return (
    <main className="px-4 pt-2">
      <BackHeader back="/profile" />
      <h1 className="mt-4 text-3xl font-extrabold">Following</h1>
      <div className="mt-4 space-y-3">
        {people.map((person) => (
          <div key={person.id} className="flex items-center gap-3">
            <Link href={`/u/${person.username}`} className="flex flex-1 items-center gap-3">
              <Avatar username={person.username} size={44} />
              <span className="font-bold">{person.displayName}</span>
            </Link>
            <FollowButton userId={person.id} following={person.following} compact />
          </div>
        ))}
      </div>
    </main>
  );
}
