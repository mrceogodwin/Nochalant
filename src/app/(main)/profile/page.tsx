import Link from "next/link";
import { Avatar } from "@/components/brand";
import { Logo, NotifyButton } from "@/components/shell";
import { requireUser } from "@/lib/auth";
import { pendingInviteCount, unreadNotes } from "@/lib/data";
import { compact } from "@/lib/format";
import { signOut } from "@/lib/actions";

const shortcuts = [
  { href: "/profile/scenes", label: "My Scenes", icon: "🎙️" },
  { href: "/profile/followers", label: "Followers", icon: "👥" },
  { href: "/profile/saved", label: "Saved", icon: "🔖" },
  { href: "/profile/history", label: "History", icon: "🕒" },
  { href: "/wallet", label: "Wallet", icon: "👛" },
];

export default async function ProfilePage() {
  const user = await requireUser();
  const [notes, invites] = await Promise.all([unreadNotes(user.id), pendingInviteCount(user.id)]);
  return (
    <main className="px-4 pt-4">
      <header className="grid grid-cols-[40px_1fr_72px] items-center">
        <span />
        <div className="flex justify-center">
          <Logo size="sm" />
        </div>
        <div className="flex justify-end">
          <NotifyButton dot={notes > 0} />
          <Link href="/profile/edit" aria-label="Settings" className="grid h-10 w-10 place-items-center">
            ⚙️
          </Link>
        </div>
      </header>
      <div className="mt-4 flex gap-3">
        <span className="relative">
          <span className="grid h-20 w-20 place-items-center overflow-hidden rounded-full ring-2 ring-[#ff7a00]">
            <Avatar username={user.username} name={user.displayName} src={user.avatarUrl} size={80} mascot={user.username === "blaqsoul"} />
          </span>
          <span className="absolute bottom-1 right-1 h-3.5 w-3.5 rounded-full bg-green-500 ring-2 ring-black" />
        </span>
        <div className="flex-1">
          <h1 className="text-2xl font-extrabold">
            {user.displayName} {user.verified ? <span className="text-[#ff9a3c]">✓</span> : null}
            {user.isPro ? <span className="ml-2 rounded-full bg-[#ff7a00] px-2 py-0.5 text-[10px] text-black">PRO</span> : null}
          </h1>
          <p className="text-sm text-zinc-400">@{user.username}</p>
          <p className="text-sm text-zinc-300">{user.interests.slice(0, 4).join(" · ") || "New on Nochalant"}</p>
          <p className="text-sm text-zinc-400">📍 {user.location}</p>
        </div>
      </div>
      <Link href="/profile/edit" className="mt-3 inline-flex rounded-full border border-[#ffb000] px-4 py-1.5 text-sm font-bold text-[#ffb000]">
        Edit Profile
      </Link>
      <div className="mt-4 grid grid-cols-3 text-center">
        <div>
          <p className="text-xl font-extrabold">{compact(user.postsCount)}</p>
          <p className="text-xs text-zinc-400">Posts</p>
        </div>
        <Link href="/profile/followers">
          <p className="text-xl font-extrabold">{compact(user.followersCount)}</p>
          <p className="text-xs text-zinc-400">Followers</p>
        </Link>
        <Link href="/profile/following">
          <p className="text-xl font-extrabold">{compact(user.followingCount)}</p>
          <p className="text-xs text-zinc-400">Following</p>
        </Link>
      </div>
      <Link href="/pro" className="mt-4 flex items-center gap-3 rounded-3xl border border-[#ff9a1a]/50 bg-gradient-to-r from-[#3a1600] to-black p-3">
        <span className="text-2xl">👑</span>
        <span className="flex-1">
          <span className="block font-extrabold">Nochalant Club {user.isPro ? "PRO" : ""}</span>
          <span className="block text-xs text-zinc-300">
            {user.isPro ? `Active · renews ${user.proRenewsAt ? new Date(user.proRenewsAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "soon"}` : "Unlock premium features, bigger rooms, more control and exclusive perks."}
          </span>
        </span>
        <span className="rounded-full bg-[#ff7a00] px-3 py-1 text-xs font-bold text-black">{user.isPro ? "Manage" : "Upgrade ›"}</span>
      </Link>
      <div className="mt-4 grid grid-cols-5 gap-2 text-center text-[11px]">
        {shortcuts.map((item) => (
          <Link key={item.href} href={item.href} className="card rounded-2xl px-1 py-3">
            <span className="block text-lg">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </div>
      <div className="mt-4 space-y-2">
        <Row href="/activity" icon="📊" title="My Activity" detail="Your posts, comments and interactions" />
        <Row href="/invites" icon="➕" title="Invites & Requests" detail="Group invites, Scene requests and follows" badge={invites || undefined} />
        <Row href="/creator" icon="⚡" title="Creator Tools" detail="Host, manage and grow your community" />
        <Row href="/help" icon="❓" title="Help & Support" detail="Get help, report issues or give feedback" />
      </div>
      <form action={signOut} className="mt-5">
        <button className="text-sm font-bold text-zinc-400">Sign out</button>
      </form>
    </main>
  );
}

function Row({ href, icon, title, detail, badge }: { href: string; icon: string; title: string; detail: string; badge?: number }) {
  return (
    <Link href={href} className="card flex items-center gap-3 rounded-2xl px-3 py-3">
      <span>{icon}</span>
      <span className="flex-1">
        <span className="block font-bold">{title}</span>
        <span className="block text-xs text-zinc-400">{detail}</span>
      </span>
      {badge ? <span className="grid h-6 min-w-6 place-items-center rounded-full bg-[#ff3b30] px-1 text-xs font-bold">{badge}</span> : null}
      <span>›</span>
    </Link>
  );
}
