import { createFileRoute } from "@tanstack/react-router";
import { ClubPage } from "@/components/club/page";
import { PostCard } from "@/components/club/feed";
import { posts } from "@/lib/club/data";
import { useClub } from "@/lib/club/store";

export const Route = createFileRoute("/polls")({ component: Polls });

function Polls() {
  const mine = useClub((state) => state.myPosts);
  const polls = [...mine, ...posts].filter((post) => post.kind === "poll");

  return (
    <ClubPage title="Polls" kicker="Pick a side">
      {polls.length === 0 ? <p className="text-secondary">No open questions.</p> : null}
      <div className="-mx-4">
        {polls.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </ClubPage>
  );
}
