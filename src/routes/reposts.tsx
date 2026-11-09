import { createFileRoute } from "@tanstack/react-router";
import { PostCard } from "@/components/club/feed";
import { ClubPage } from "@/components/club/page";
import { posts as seedPosts } from "@/lib/club/data";
import { useClub } from "@/lib/club/store";

export const Route = createFileRoute("/reposts")({ component: Reposts });

function Reposts() {
  const reposts = useClub((state) => state.reposts);
  const myPosts = useClub((state) => state.myPosts);
  const posts = reposts
    .map((id) => [...myPosts, ...seedPosts].find((post) => post.id === id))
    .filter((post) => post !== undefined);

  return (
    <ClubPage title="Reposts" kicker="Passed along" back="/my-club" tabs={false}>
      {posts.length === 0 ? (
        <p className="text-secondary">Repost from a post and it lands here. This does not notify anyone else. The Club is still on this device.</p>
      ) : null}
      <div className="-mx-4">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </ClubPage>
  );
}
