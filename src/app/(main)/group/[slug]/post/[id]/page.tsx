import { notFound } from "next/navigation";
import { Avatar } from "@/components/brand";
import { CommentForm } from "@/components/forms";
import { BackHeader } from "@/components/shell";
import { requireUser } from "@/lib/auth";
import { getPost, postComments } from "@/lib/data";
import { relativeTime } from "@/lib/format";

export default async function PostPage({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const user = await requireUser();
  const { slug, id } = await params;
  const post = await getPost(id, user.id);
  if (!post) notFound();
  const comments = await postComments(id);
  return (
    <main className="px-4 pt-2">
      <BackHeader back={`/group/${slug}`} />
      <article className="mt-4">
        <div className="flex items-center gap-2">
          <Avatar username={post.username} size={40} />
          <div>
            <p className="font-bold">{post.displayName}</p>
            <p className="text-xs text-zinc-500">{relativeTime(post.createdAt)}</p>
          </div>
        </div>
        <p className="mt-3 leading-6">{post.body}</p>
      </article>
      <div className="mt-6 space-y-4">
        {comments.map((comment) => (
          <div key={comment.id} className="flex gap-2">
            <Avatar username={comment.username} size={32} />
            <div>
              <p className="text-sm font-bold">{comment.displayName}</p>
              <p className="text-sm text-zinc-200">{comment.body}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6">
        <CommentForm postId={id} slug={slug} />
      </div>
    </main>
  );
}
