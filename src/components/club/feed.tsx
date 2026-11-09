import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Bookmark, Gift, Heart, MessageCircle, MoreHorizontal, Repeat2 } from "lucide-react";
import { toast } from "sonner";
import { Collectible } from "@/components/club/objects";
import { CommentSheet, GiftSheet, ReportSheet } from "@/components/club/sheets";
import { VoiceNote } from "@/components/club/voice";
import { memberById, posts as seedPosts } from "@/lib/club/data";
import { useClub } from "@/lib/club/store";
import type { Post } from "@/lib/club/types";
import { cn } from "@/lib/utils";

export function authorName(id: string, mineName: string) {
  if (id === "me") return mineName || "You";
  return memberById(id)?.name ?? "Member";
}

export function PostCard({ post }: { post: Post }) {
  const mineName = useClub((state) => state.name);
  const emoji = useClub((state) => state.emoji);
  const liked = useClub((state) => state.liked.includes(post.id));
  const saved = useClub((state) => state.saved.includes(post.id));
  const reposted = useClub((state) => state.reposts.includes(post.id));
  const toggleLike = useClub((state) => state.toggleLike);
  const toggleSave = useClub((state) => state.toggleSave);
  const toggleRepost = useClub((state) => state.toggleRepost);
  const vote = useClub((state) => state.vote);
  const choice = useClub((state) => state.pollVotes[post.id]);
  const blocked = useClub((state) => state.blocked);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [giftOpen, setGiftOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const author = post.authorId === "me" ? null : memberById(post.authorId);
  if (author && blocked.includes(author.id)) return null;
  const name = authorName(post.authorId, mineName);
  const totalVotes = (post.poll ?? []).reduce((sum, option, index) => sum + option.votes + (choice === index ? 1 : 0), 0);

  return (
    <article className="border-b border-line px-4 py-4">
      <div className="flex items-start gap-3">
        <span className="w-12 shrink-0">
          {author ? (
            <Link to="/people/$handle" params={{ handle: author.handle }} aria-label={author.name}>
              <Collectible id={author.object} />
            </Link>
          ) : (
            <Collectible id={emoji} />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              {author ? (
                <Link to="/people/$handle" params={{ handle: author.handle }} className="font-semibold leading-tight">
                  {name}
                </Link>
              ) : (
                <p className="font-semibold leading-tight">{name}</p>
              )}
              <p className="text-xs text-muted">
                {author?.personality ?? "Your post"} · {post.time}
              </p>
            </div>
            <button type="button" aria-label="More" onClick={() => setMenuOpen((value) => !value)} className="text-muted">
              <MoreHorizontal className="size-5" />
            </button>
          </div>
          {menuOpen ? (
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                className="rounded-full border border-line px-3 py-1 text-xs"
                onClick={() => {
                  toggleSave(post.id);
                  setMenuOpen(false);
                }}
              >
                {saved ? "Saved" : "Save"}
              </button>
              <button
                type="button"
                className="rounded-full border border-line px-3 py-1 text-xs"
                onClick={() => {
                  setReportOpen(true);
                  setMenuOpen(false);
                }}
              >
                Report
              </button>
            </div>
          ) : null}
          <p className="mt-3 text-base">{post.text}</p>
          {post.kind === "voice" ? (
            <div className="mt-3 rounded-2xl bg-card px-3 py-3">
              <VoiceNote duration={post.duration} preview={post.preview} src={post.audio} />
            </div>
          ) : null}
          {post.object ? (
            <div className="mt-3 w-28">
              <Collectible id={post.object} />
            </div>
          ) : null}
          {post.poll ? (
            <div className="mt-3 flex flex-col gap-2">
              {post.poll.map((option, index) => {
                const votes = option.votes + (choice === index ? 1 : 0);
                const width = totalVotes ? Math.round((votes / totalVotes) * 100) : 0;
                return (
                  <button
                    key={option.id}
                    type="button"
                    disabled={choice !== undefined}
                    onClick={() => vote(post.id, index)}
                    className="relative h-11 overflow-hidden rounded-full border border-line text-left"
                  >
                    <span className="absolute inset-y-0 left-0 bg-card" style={{ width: `${choice === undefined ? 0 : width}%` }} />
                    <span className="relative flex items-center justify-between px-4 text-sm">
                      <span>{option.label}</span>
                      {choice !== undefined ? <span className="tabular-nums text-secondary">{width}%</span> : null}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : null}
          <div className="mt-3 flex items-center gap-1 text-secondary">
            <button type="button" aria-label="Like" onClick={() => toggleLike(post.id)} className="inline-flex h-10 items-center gap-1 px-2">
              <Heart className={cn("size-5", liked && "fill-paper text-paper")} />
              <span className="text-xs tabular-nums">{post.likes + (liked ? 1 : 0)}</span>
            </button>
            <button type="button" aria-label="Reply" onClick={() => setCommentsOpen(true)} className="inline-flex h-10 items-center gap-1 px-2">
              <MessageCircle className="size-5" />
            </button>
            <button
              type="button"
              aria-label="Repost"
              onClick={() => toast(toggleRepost(post.id) ? "Reposted to your Club" : "Repost removed")}
              className="inline-flex size-10 items-center justify-center"
            >
              <Repeat2 className={cn("size-5", reposted && "text-paper")} />
            </button>
            <button type="button" aria-label="Send a gift" onClick={() => setGiftOpen(true)} className="inline-flex size-10 items-center justify-center">
              <Gift className="size-5" />
            </button>
            <button type="button" aria-label="Save" onClick={() => toggleSave(post.id)} className="ml-auto inline-flex size-10 items-center justify-center">
              <Bookmark className={cn("size-5", saved && "fill-paper text-paper")} />
            </button>
          </div>
        </div>
      </div>
      <CommentSheet open={commentsOpen} onOpenChange={setCommentsOpen} postId={post.id} />
      <GiftSheet open={giftOpen} onOpenChange={setGiftOpen} to={post.authorId === "me" ? "the room" : post.authorId} />
      <ReportSheet open={reportOpen} onOpenChange={setReportOpen} name={name} />
    </article>
  );
}

export function Feed({ filter }: { filter: "foryou" | "following" | "friends" | "voice" | "trending" }) {
  const myPosts = useClub((state) => state.myPosts);
  const following = useClub((state) => state.following);
  const all = [...myPosts, ...seedPosts];
  const visible = all.filter((post) => {
    if (filter === "voice") return post.kind === "voice";
    if (filter === "following") return post.authorId === "me" || following.includes(post.authorId);
    if (filter === "friends") return ["malik", "adaeze", "june"].includes(post.authorId) && following.includes(post.authorId);
    return true;
  });
  const ordered = filter === "trending" ? [...visible].sort((a, b) => b.likes - a.likes) : visible;
  if (ordered.length === 0) {
    return (
      <div className="px-6 py-16 text-center">
        <p className="font-display text-2xl">Nothing in this lane yet.</p>
        <p className="mt-2 text-secondary">
          {filter === "following" || filter === "friends"
            ? "Follow a few people from Discover and this room fills in."
            : "Voice notes show up here when someone actually says something."}
        </p>
      </div>
    );
  }
  return (
    <div>
      {ordered.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}
