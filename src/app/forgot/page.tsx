import { BackHeader } from "@/components/shell";
import { SUPPORT_EMAIL } from "@/lib/catalog";

export default function ForgotPage() {
  return (
    <main className="min-h-dvh px-5 pb-24">
      <BackHeader back="/signin" />
      <h1 className="mt-6 text-3xl font-extrabold">Reset password</h1>
      <p className="mt-3 leading-6 text-zinc-300">
        Password reset email is not wired yet. Write to {SUPPORT_EMAIL} from the address on your account and we will help you back in.
        You can also create a new account with a different email.
      </p>
    </main>
  );
}
