import { requireUser } from "@/lib/auth";
import { transactions } from "@/lib/data";
import { BackHeader } from "@/components/shell";
import { formatNaira } from "@/lib/format";

export default async function EarningsPage() {
  const user = await requireUser();
  const rows = (await transactions(user.id)).filter((row) => row.kind === "earnings" || row.kind === "gift_in");
  const total = rows.reduce((sum, row) => sum + Math.max(row.amountNaira, 0), 0);
  return (
    <main className="px-4 pt-2">
      <BackHeader back="/wallet" />
      <h1 className="mt-4 text-3xl font-extrabold">Earnings</h1>
      <p className="mt-2 text-4xl font-black text-[#ffb000]">{formatNaira(total)}</p>
      <div className="mt-4 space-y-2">
        {rows.map((row) => (
          <div key={row.id} className="card rounded-2xl px-3 py-3">
            <p className="font-bold">{row.title}</p>
            <p className="text-sm text-zinc-400">{row.detail} · {formatNaira(row.amountNaira)}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
