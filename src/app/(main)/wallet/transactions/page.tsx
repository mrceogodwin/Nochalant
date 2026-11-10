import { requireUser } from "@/lib/auth";
import { transactions } from "@/lib/data";
import { BackHeader } from "@/components/shell";
import { formatNaira, relativeTime } from "@/lib/format";

export default async function TransactionsPage() {
  const user = await requireUser();
  const rows = await transactions(user.id);
  return (
    <main className="px-4 pt-2">
      <BackHeader back="/wallet" />
      <h1 className="mt-4 text-3xl font-extrabold">Transactions</h1>
      <div className="mt-4 space-y-2">
        {rows.map((row) => (
          <div key={row.id} className="card rounded-2xl px-3 py-3">
            <div className="flex justify-between">
              <p className="font-bold">{row.title}</p>
              <p className={row.amountNaira >= 0 ? "text-green-400" : "text-red-400"}>{formatNaira(row.amountNaira)}</p>
            </div>
            <p className="text-xs text-zinc-400">{row.detail} · {relativeTime(row.createdAt)}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
