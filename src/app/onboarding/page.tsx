import { redirect } from "next/navigation";
import { OnboardingForm } from "@/components/forms";
import { Logo } from "@/components/shell";
import { getCurrentUser } from "@/lib/auth";

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");
  if (user.onboarded) redirect("/home");
  return (
    <main className="min-h-dvh px-5 pb-24">
      <div className="flex justify-center pt-5">
        <Logo size="sm" />
      </div>
      <ol className="mt-5 grid grid-cols-3 text-center text-[11px] text-zinc-400">
        <li>
          <span className="mx-auto grid h-7 w-7 place-items-center rounded-full bg-[#ff7a00] text-black">✓</span>
          <span className="mt-1 block">Create Account</span>
        </li>
        <li>
          <span className="mx-auto grid h-7 w-7 place-items-center rounded-full bg-[#ff7a00] font-bold text-black">2</span>
          <span className="mt-1 block text-white">Set Up Profile</span>
        </li>
        <li>
          <span className="mx-auto grid h-7 w-7 place-items-center rounded-full border border-white/20">3</span>
          <span className="mt-1 block">Explore</span>
        </li>
      </ol>
      <h1 className="mt-5 text-center text-[32px] font-extrabold">Set up your profile</h1>
      <p className="mb-4 text-center text-sm text-zinc-300">Add a few details so people can know you on Nochalant.</p>
      <OnboardingForm displayName={user.displayName} bio={user.bio} interests={user.interests} />
    </main>
  );
}
