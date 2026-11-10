import { withdraw } from "@/lib/actions";
import { requireUser } from "@/lib/auth";
import { BackHeader } from "@/components/shell";
import { formatNaira } from "@/lib/format";

export default async function WithdrawPage() {
  const user = await requireUser();
  return (
    <main className="px-4 pt-2">
      <BackHeader back="/wallet" />
      <h1 className="mt-4 text-3xl font-extrabold">Withdraw</h1>
      <p className="mt-1 text-sm text-zinc-400">Available {formatNaira(user.walletNaira, true)}. Live Paystack Transfers need PAYSTACK_SECRET_KEY. Until then the request is saved as pending review.</p>
      <form action={withdraw} className="mt-4 space-y-3">
        <input name="amount" type="number" min={100} placeholder="Amount" className="field h-12 w-full rounded-full px-4" />
        <input name="bank" defaultValue={user.bankName ?? "GTB"} placeholder="Bank" className="field h-12 w-full rounded-full px-4" />
        <input name="account" defaultValue={user.accountNumber ?? ""} placeholder="Account number" className="field h-12 w-full rounded-full px-4" />
        <button className="orange-fill h-12 w-full rounded-full font-bold">Request withdrawal</button>
      </form>
    </main>
  );
}
