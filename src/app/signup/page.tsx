import Link from "next/link";
import { Mascot } from "@/components/brand";
import { SignUpForm } from "@/components/forms";
import { BackHeader } from "@/components/shell";
import { getCurrentUser, googleConfigured } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function SignUpPage({ searchParams }: { searchParams: Promise<{ notice?: string }> }) {
  const user = await getCurrentUser();
  if (user?.onboarded) redirect("/home");
  if (user) redirect("/onboarding");
  const notice = (await searchParams).notice;
  return (
    <main className="min-h-dvh px-5 pb-24">
      <BackHeader back="/" />
      <h1 className="mt-4 text-center text-[34px] font-extrabold leading-tight">Create your account</h1>
      <p className="mt-1 text-center text-zinc-300">Join the Club and be part of the scene.</p>
      <div className="mt-2 flex justify-center">
        <Mascot size={150} />
      </div>
      <SignUpForm notice={notice} />
      <div className="my-5 flex items-center gap-3 text-xs text-zinc-500">
        <span className="h-px flex-1 bg-white/15" />
        or continue with
        <span className="h-px flex-1 bg-white/15" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Link href="/api/auth/google" className="field flex h-12 items-center justify-center gap-2 rounded-full font-bold">
          <span className="text-[#4285F4]">G</span> Google
        </Link>
        <Link href="/api/auth/apple" className="field flex h-12 items-center justify-center gap-2 rounded-full font-bold">
          <span> </span> Apple
        </Link>
      </div>
      {!googleConfigured() ? (
        <p className="mt-3 text-center text-[11px] text-zinc-500">Google and Apple light up when their keys are set. Email sign-up works now.</p>
      ) : null}
      <p className="mt-6 text-center text-sm text-zinc-300">
        Already have an account?{" "}
        <Link href="/signin" className="font-bold text-[#ff7a00]">
          Sign in
        </Link>
      </p>
    </main>
  );
}
