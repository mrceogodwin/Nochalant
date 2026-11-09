import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Collectible } from "@/components/club/objects";
import { ClubPage } from "@/components/club/page";
import { PostCard } from "@/components/club/feed";
import { memberByHandle, posts } from "@/lib/club/data";
import { useClub } from "@/lib/club/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/people/$handle")({
  component: Person,
});

function Person() {
  const { handle } = Route.useParams();
  const member = memberByHandle(handle);
  const following = useClub((state) => state.following);
  const toggleFollow = useClub((state) => state.toggleFollow);
  const blocked = useClub((state) => state.blocked);
  const block = useClub((state) => state.block);
  const myPosts = useClub((state) => state.myPosts);

  if (!member) {
    return (
      <ClubPage title="Nobody by that name" back="/discover" tabs={false}>
        <p className="text-secondary">Check the spelling, or they left the Club.</p>
      </ClubPage>
    );
  }

  const isBlocked = blocked.includes(member.id);
  const on = following.includes(member.id);
  const theirs = [...myPosts, ...posts].filter((post) => post.authorId === member.id);

  return (
    <ClubPage title={member.name} kicker={member.personality} back="/discover" tabs={false}>
      <div className="membership-card rounded-3xl p-4">
        <div className="flex items-center gap-4">
          <span className="w-20">
            <Collectible id={member.object} />
          </span>
          <div>
            <p className="font-display text-2xl font-semibold">{member.name}</p>
            <p className="text-secondary">@{member.handle}</p>
            <p className="mt-2 text-sm text-secondary">{member.line}</p>
          </div>
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          disabled={isBlocked}
          onClick={() => toggleFollow(member.id)}
          className={cn("h-11 flex-1 rounded-full text-sm font-semibold", on ? "border border-line" : "bg-paper text-ink")}
        >
          {on ? "Following" : "Follow"}
        </button>
        <Link to="/chats/$id" params={{ id: member.id }} className="inline-flex h-11 flex-1 items-center justify-center rounded-full border border-line text-sm font-semibold">
          Message
        </Link>
      </div>
      <button
        type="button"
        className="mt-3 text-sm text-muted"
        onClick={() => {
          block(member.id);
          toast(`${member.name} is blocked on this device`);
        }}
      >
        {isBlocked ? "Blocked" : "Block"}
      </button>
      <h2 className="mt-6 font-display text-xl font-semibold">Posts</h2>
      {isBlocked ? <p className="mt-2 text-sm text-secondary">You blocked this member. Their posts stay hidden.</p> : null}
      {!isBlocked && theirs.length === 0 ? <p className="mt-2 text-sm text-secondary">Nothing public yet.</p> : null}
      <div className="-mx-4 mt-2">
        {!isBlocked ? theirs.map((post) => <PostCard key={post.id} post={post} />) : null}
      </div>
    </ClubPage>
  );
}
