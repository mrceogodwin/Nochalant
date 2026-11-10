import { completeTestPayment, startTopUp } from "@/lib/actions";
import { paystackConfigured } from "@/lib/auth";
import { BackHeader } from "@/components/shell";
import { getDb, type Row } from "@/lib/db";

export default async function AddFundsPage({ searchParams }: { searchParams: Promise<{ reference?: string; error?: string }> }) {
  const params = await searchParams;
  let status = "";
  if (params.reference) {
    const db = getDb();
    const rows = (await db`SELECT status, amount_naira FROM social.payments WHERE reference = ${params.reference} LIMIT 1`) as Row[];
    status = rows[0] ? `${rows[0].status} · ₦${rows[0].amount_naira}` : "";
  }
  return (
    <main className="px-4 pt-2">
      <BackHeader back="/wallet" />
      <h1 className="mt-4 text-3xl font-extrabold">Add funds</h1>
      <p className="mt-2 text-sm text-zinc-400">
        {paystackConfigured() ? "You’ll pay with Paystack." : "Paystack keys are not set, so this top-up runs in test mode and credits the wallet without a charge."}
      </p>
      {params.error ? <p className="mt-2 text-sm text-amber-300">Paystack did not start. You can finish in test mode.</p> : null}
      {status ? <p className="mt-2 text-sm">Payment {status}</p> : null}
      <form action={startTopUp} className="mt-4 space-y-3">
        <input name="amount" type="number" min={100} step={100} defaultValue={5000} className="field h-12 w-full rounded-full px-4" />
        <button className="orange-fill h-12 w-full rounded-full font-bold">Continue</button>
      </form>
      {params.reference && !paystackConfigured() ? (
        <form action={completeTestPayment.bind(null, params.reference)} className="mt-3">
          <button className="h-12 w-full rounded-full border border-[#ff7a00] font-bold">Complete test top-up</button>
        </form>
      ) : null}
    </main>
  );
}
