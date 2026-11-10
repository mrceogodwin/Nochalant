import Link from "next/link";
import { BackHeader } from "@/components/shell";
import { requireUser } from "@/lib/auth";
import { savedPosts } from "@/lib/data";

export default async function SavedPage() {
  const user = await requireUser();
  const posts = await savedPosts(user.id);
  return (
    <main className="px-4 pt-2">
      <BackHeader back="/profile" />
      <h1 className="mt-4 text-3xl font-extrabold">Saved</h1>
      <div className="mt-4 space-y-3">
        {posts.map((post) => (
          <Link key={post.id} href={`/group/movie-heads/post/${post.id}`} className="card block rounded-2xl p-3 text-sm">{post.body}</Link>
        ))}
        {posts.length === 0 ? <p className="text-sm text-zinc-400">Save a post from a group and it lands here.</p> : null}
      </div>
    </main>
  );
}
