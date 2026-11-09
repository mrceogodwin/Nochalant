import { createFileRoute } from "@tanstack/react-router";
import { PostCard } from "@/components/club/feed";
import { ClubPage } from "@/components/club/page";
import { posts as seedPosts } from "@/lib/club/data";
import { useClub } from "@/lib/club/store";

export const Route = createFileRoute("/saved")({ component: Saved });

function Saved() {
  const saved = useClub((state) => state.saved);
  const myPosts = useClub((state) => state.myPosts);
  const posts = [...myPosts, ...seedPosts].filter((post) => saved.includes(post.id));

  return (
    <ClubPage title="Saved" kicker="Kept on this device" back="/my-club" tabs={false}>
      {posts.length === 0 ? <p className="text-secondary">Save a post from Home and it stays here.</p> : null}
      <div className="-mx-4">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </ClubPage>
  );
}
