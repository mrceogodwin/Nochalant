import { completeTestPayment } from "@/lib/actions";
import { activeProvider, paymentBrand } from "@/lib/payments/provider";
import { BackHeader } from "@/components/shell";
import { getDb, type Row } from "@/lib/db";

export default async function CheckoutPage({ searchParams }: { searchParams: Promise<{ reference?: string; error?: string }> }) {
  const params = await searchParams;
  const db = getDb();
  const rows = params.reference
    ? ((await db`SELECT plan, amount_naira, status FROM social.payments WHERE reference = ${params.reference} LIMIT 1`) as Row[])
    : [];
  const payment = rows[0];
  return (
    <main className="px-4 pt-2">
      <BackHeader back="/pro" />
      <h1 className="mt-4 text-3xl font-extrabold">Checkout</h1>
      {payment ? (
        <p className="mt-2 text-zinc-300">
          {String(payment.plan)} · ₦{Number(payment.amount_naira).toLocaleString("en-NG")} · {String(payment.status)}
        </p>
      ) : (
        <p className="mt-2 text-zinc-400">No payment was found.</p>
      )}
      <p className="mt-3 text-sm text-zinc-400">
        {activeProvider() === "test"
          ? "Test mode is on. Completing this marks the account Pro without a charge. With Bachs keys, only a signed webhook grants Pro."
          : `Checkout runs on ${paymentBrand()}. This page does not grant Pro. Access starts when collection.succeeded is verified.`}
      </p>
      {params.error ? <p className="mt-2 text-sm text-amber-300">{params.error}</p> : null}
      {params.reference && activeProvider() === "test" ? (
        <form action={completeTestPayment.bind(null, params.reference)} className="mt-5">
          <button className="orange-fill h-14 w-full rounded-full font-extrabold">Complete test payment</button>
        </form>
      ) : null}
    </main>
  );
}
