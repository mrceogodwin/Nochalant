import Link from "next/link";
import { redirect } from "next/navigation";
import { Eye } from "lucide-react";
import { Mascot } from "@/components/brand";
import { GhostButton, Logo } from "@/components/shell";
import { getCurrentUser } from "@/lib/auth";

export default async function WelcomePage() {
  const user = await getCurrentUser();
  if (user?.onboarded) redirect("/home");
  if (user) redirect("/onboarding");
  return (
    <main className="flex min-h-dvh flex-col px-6 pb-28 pt-10">
      <div className="flex justify-center">
        <Logo size="lg" />
      </div>
      <div className="mt-6 flex justify-center">
        <Mascot size={230} />
      </div>
      <h1 className="mt-2 text-center text-[40px] font-extrabold leading-[1.05] tracking-tight">
        Your people.
        <br />
        Your scene.
        <br />
        <span className="text-[#ff7a00]">Your rules.</span>
      </h1>
      <p className="mx-auto mt-4 max-w-[320px] text-center text-[15px] leading-6 text-zinc-300">
        Join a social world of live talks, debates, confessions, music, games and real connections.
      </p>
      <div className="mt-8 space-y-3">
        <Link href="/signup" className="orange-fill relative flex h-14 w-full items-center justify-center rounded-full text-[17px] font-extrabold shadow-[0_12px_30px_rgba(255,90,0,0.28)]">
          Create your account
          <span className="absolute right-1.5 grid h-11 w-11 place-items-center rounded-full bg-black text-white">→</span>
        </Link>
        <GhostButton href="/signin">Sign in</GhostButton>
      </div>
      <Link href="/explore" className="mt-8 flex items-center justify-center gap-2 text-[15px] font-bold">
        <Eye size={18} className="text-[#ff7a00]" /> Explore Public Scenes <span className="text-[#ff7a00]">›</span>
      </Link>
    </main>
  );
}
