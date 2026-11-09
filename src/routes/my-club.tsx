import { createFileRoute, Link } from "@tanstack/react-router";
import { Collectible } from "@/components/club/objects";
import { ClubFrame } from "@/components/club/shell";
import { collectibleNames, personalityById, posts as seedPosts } from "@/lib/club/data";
import { useClub } from "@/lib/club/store";
import { roles } from "@/lib/club/data";

export const Route = createFileRoute("/my-club")({ component: MyClub });

const library = [
  { to: "/following", label: "Following" },
  { to: "/followers", label: "Followers" },
  { to: "/saved", label: "Saved" },
  { to: "/reposts", label: "Reposts" },
  { to: "/drafts", label: "Drafts" },
  { to: "/gifts", label: "Gifts" },
  { to: "/club-tokens", label: "Club Tokens" },
  { to: "/emoji", label: "Emoji" },
  { to: "/table", label: "The Table" },
  { to: "/challenges", label: "Challenges" },
  { to: "/leaders", label: "Tonight's table" },
  { to: "/identity", label: "Edit Club ID" },
  { to: "/settings", label: "Settings" },
] as const;

function MyClub() {
  const state = useClub();
  const personality = personalityById(state.personality);
  const role = roles.find((item) => item.id === state.role);
  const postCount = state.myPosts.length;
  const savedPosts = [...state.myPosts, ...seedPosts].filter((post) => state.saved.includes(post.id));

  return (
    <ClubFrame>
      <div className="px-4 pt-4 pb-8">
        <div className="membership-card rounded-3xl p-5">
          <div className="flex items-start justify-between">
            <p className="text-xs tracking-[0.2em] text-secondary">NOCHALANT CLUB</p>
            <span className="rounded-full border border-line px-2 py-0.5 text-xs">18+</span>
          </div>
          <div className="mt-4 flex items-center gap-4">
            <span className="w-20">
              <Collectible id={state.emoji} />
            </span>
            <div>
              <p className="font-display text-3xl font-semibold leading-none">{state.name || "Unnamed"}</p>
              <p className="mt-1 text-secondary">@{state.handle || "member"}</p>
            </div>
          </div>
          <p className="mt-4 text-sm text-secondary">
            {personality?.name ?? "No personality worn"}
            {role ? ` · ${role.name}` : ""}
            {state.isPrivate ? " · Private" : ""}
          </p>
          {state.bio ? <p className="mt-2 text-sm">{state.bio}</p> : null}
          <p className="mt-4 text-xs tracking-widest text-muted">{collectibleNames[state.emoji].toUpperCase()}</p>
        </div>
        <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-2xl bg-card py-3">
            <dt className="text-xs text-muted">Posts</dt>
            <dd className="font-display text-xl tabular-nums">{postCount}</dd>
          </div>
          <div className="rounded-2xl bg-card py-3">
            <dt className="text-xs text-muted">Following</dt>
            <dd className="font-display text-xl tabular-nums">{state.following.length}</dd>
          </div>
          <div className="rounded-2xl bg-card py-3">
            <dt className="text-xs text-muted">Gifts in</dt>
            <dd className="font-display text-xl tabular-nums">{state.gifts.length}</dd>
          </div>
        </dl>
        <h2 className="mt-6 font-display text-xl font-semibold">Gifts received</h2>
        <div className="mt-3 flex gap-3 overflow-x-auto">
          {state.gifts.map((gift) => (
            <div key={gift.id} className="w-28 shrink-0 rounded-3xl border border-line p-3">
              <Collectible id={gift.object} />
              <p className="mt-1 text-xs text-secondary">{gift.note}</p>
            </div>
          ))}
          {state.gifts.length === 0 ? <p className="text-sm text-secondary">Nothing gifted yet.</p> : null}
        </div>
        {state.sentGifts.length ? (
          <>
            <h2 className="mt-6 font-display text-xl font-semibold">Sent</h2>
            <div className="mt-3 flex gap-3 overflow-x-auto">
              {state.sentGifts.map((gift) => (
                <div key={gift.id} className="w-28 shrink-0">
                  <Collectible id={gift.object} />
                  <p className="text-xs text-muted">{gift.note}</p>
                </div>
              ))}
            </div>
          </>
        ) : null}
        <h2 className="mt-6 font-display text-xl font-semibold">Saved</h2>
        {savedPosts.length === 0 ? (
          <p className="mt-2 text-sm text-secondary">Save a post from Home and it stays on this card.</p>
        ) : (
          <ul className="mt-2 flex flex-col gap-2">
            {savedPosts.map((post) => (
              <li key={post.id} className="rounded-2xl bg-card px-3 py-2 text-sm">
                {post.text}
              </li>
            ))}
          </ul>
        )}
        <div className="mt-6 flex flex-col overflow-hidden rounded-3xl border border-line">
          {library.map((item) => (
            <Link key={item.to} to={item.to} className="flex items-center justify-between border-b border-line px-4 py-3 text-sm last:border-b-0">
              <span>{item.label}</span>
              <span className="text-muted">
                {item.to === "/following"
                  ? state.following.length
                  : item.to === "/club-tokens"
                    ? state.tokens
                    : item.to === "/drafts"
                      ? state.drafts.length
                      : item.to === "/saved"
                        ? savedPosts.length
                        : item.to === "/reposts"
                          ? state.reposts.length
                          : ""}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </ClubFrame>
  );
}
