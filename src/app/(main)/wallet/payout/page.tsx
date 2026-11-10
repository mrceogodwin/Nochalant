import { savePayout } from "@/lib/actions";
import { requireUser } from "@/lib/auth";
import { BackHeader } from "@/components/shell";

export default async function PayoutPage() {
  const user = await requireUser();
  return (
    <main className="px-4 pt-2">
      <BackHeader back="/wallet" />
      <h1 className="mt-4 text-3xl font-extrabold">Payout settings</h1>
      <form action={savePayout} className="mt-4 space-y-3">
        <input name="accountName" defaultValue={user.accountName ?? user.displayName} placeholder="Account name" className="field h-12 w-full rounded-full px-4" />
        <input name="bank" defaultValue={user.bankName ?? ""} placeholder="Bank" className="field h-12 w-full rounded-full px-4" />
        <input name="account" defaultValue={user.accountNumber ?? ""} placeholder="Account number" className="field h-12 w-full rounded-full px-4" />
        <button className="orange-fill h-12 w-full rounded-full font-bold">Save</button>
      </form>
    </main>
  );
}
