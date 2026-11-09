import { createFileRoute, Link } from "@tanstack/react-router";
import { Collectible } from "@/components/club/objects";
import { ClubPage } from "@/components/club/page";
import { members, posts } from "@/lib/club/data";

export const Route = createFileRoute("/leaders")({ component: Leaders });

function Leaders() {
  const board = members
    .map((member) => {
      const theirs = posts.filter((post) => post.authorId === member.id);
      const likes = theirs.reduce((sum, post) => sum + post.likes, 0);
      return { member, likes, count: theirs.length };
    })
    .sort((a, b) => b.likes - a.likes || b.count - a.count);

  return (
    <ClubPage title="Tonight's table" kicker="This scene" back="/discover" tabs={false}>
      <p className="text-sm text-secondary">
        Ordered by likes on the posts already written into this scene. Not a live leaderboard, and not a member count.
      </p>
      <ol className="mt-4 flex flex-col gap-2">
        {board.map((row, index) => (
          <li key={row.member.id}>
            <Link to="/people/$handle" params={{ handle: row.member.handle }} className="flex items-center gap-3 rounded-3xl border border-line px-3 py-2">
              <span className="w-6 text-sm tabular-nums text-muted">{index + 1}</span>
              <span className="w-12">
                <Collectible id={row.member.object} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">{row.member.name}</span>
                <span className="block text-xs text-muted">{row.count === 0 ? "No post in the scene" : `${row.count} post${row.count === 1 ? "" : "s"}`}</span>
              </span>
              <span className="text-sm tabular-nums text-secondary">{row.likes}</span>
            </Link>
          </li>
        ))}
      </ol>
    </ClubPage>
  );
}
