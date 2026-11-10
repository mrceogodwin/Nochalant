import Link from "next/link";
import { redirect } from "next/navigation";
import { Mascot } from "@/components/brand";
import { GhostButton } from "@/components/shell";
import { getCurrentUser } from "@/lib/auth";

const links = [
  { href: "/home?tab=live", title: "Join Live Scenes", detail: "Talk, listen and vibe in real time.", icon: "🎙️" },
  { href: "/discover?filter=people", title: "Discover People", detail: "Find and connect with your kind of people.", icon: "👥" },
  { href: "/discover?filter=groups", title: "Join Groups", detail: "Be part of chats, communities and interests.", icon: "🔥" },
];

export default async function ReadyPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");
  if (!user.onboarded) redirect("/onboarding");
  return (
    <main className="min-h-dvh px-5 pb-28 pt-8">
      <div className="flex justify-center">
        <Mascot pose="thumbs" size={210} />
      </div>
      <h1 className="text-center text-[36px] font-extrabold">
        You’re all set! <span className="inline-grid h-8 w-8 place-items-center rounded-full bg-[#ff7a00] text-base text-black">✓</span>
      </h1>
      <p className="mt-1 text-center text-zinc-300">Your account is ready. Welcome to the Club!</p>
      <div className="card mt-5 divide-y divide-white/10 overflow-hidden rounded-3xl">
        {links.map((link) => (
          <Link key={link.href} href={link.href} className="flex items-center gap-3 px-4 py-4">
            <span className="text-[#ff7a00]">{link.icon}</span>
            <span className="flex-1">
              <span className="block font-bold">{link.title}</span>
              <span className="block text-sm text-zinc-400">{link.detail}</span>
            </span>
            <span>›</span>
          </Link>
        ))}
      </div>
      <div className="mt-5 space-y-3">
        <Link href="/home" className="orange-fill relative flex h-14 items-center justify-center rounded-full font-extrabold">
          Explore Nochalant
          <span className="absolute right-1.5 grid h-11 w-11 place-items-center rounded-full bg-black text-white">→</span>
        </Link>
        <GhostButton href="/home">Maybe Later</GhostButton>
      </div>
    </main>
  );
}
