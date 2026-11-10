import Link from "next/link";
import { redirect } from "next/navigation";
import { SignInForm } from "@/components/forms";
import { BackHeader } from "@/components/shell";
import { getCurrentUser } from "@/lib/auth";

export default async function SignInPage() {
  const user = await getCurrentUser();
  if (user?.onboarded) redirect("/home");
  if (user) redirect("/onboarding");
  return (
    <main className="min-h-dvh px-5 pb-24">
      <BackHeader back="/" />
      <h1 className="mt-6 text-center text-[34px] font-extrabold">Sign in</h1>
      <p className="mt-1 mb-8 text-center text-zinc-300">Welcome back to the Club.</p>
      <SignInForm />
      <p className="mt-4 text-center text-sm">
        <Link href="/forgot" className="text-zinc-400">
          Forgot password?
        </Link>
      </p>
      <div className="my-5 flex items-center gap-3 text-xs text-zinc-500">
        <span className="h-px flex-1 bg-white/15" />
        or continue with
        <span className="h-px flex-1 bg-white/15" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Link href="/api/auth/google" className="field flex h-12 items-center justify-center gap-2 rounded-full font-bold">
          G Google
        </Link>
        <Link href="/api/auth/apple" className="field flex h-12 items-center justify-center gap-2 rounded-full font-bold">
          Apple
        </Link>
      </div>
      <p className="mt-6 text-center text-sm text-zinc-300">
        New here?{" "}
        <Link href="/signup" className="font-bold text-[#ff7a00]">
          Create your account
        </Link>
      </p>
    </main>
  );
}
