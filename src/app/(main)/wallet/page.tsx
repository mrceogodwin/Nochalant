import Link from "next/link";
import { Mascot } from "@/components/brand";
import { BackHeader } from "@/components/shell";
import { requireUser } from "@/lib/auth";
import { transactions } from "@/lib/data";
import { formatNaira, relativeTime } from "@/lib/format";

export default async function WalletPage() {
  const user = await requireUser();
  const rows = await transactions(user.id);
  return (
    <main className="px-4 pt-2">
      <BackHeader back="/profile" />
      <div className="relative">
        <h1 className="mt-3 text-4xl font-extrabold">My Wallet</h1>
        <p className="text-sm text-zinc-400">Your balance, gifts, rewards and payouts.</p>
        <span className="absolute right-0 top-0"><Mascot size={90} /></span>
      </div>
      <section className="mt-4 rounded-3xl border border-[#ff9a1a] bg-gradient-to-br from-[#5a2400] to-[#1a0a00] p-4">
        <p className="text-sm text-zinc-200">Available Balance</p>
        <p className="text-4xl font-black">{formatNaira(user.walletNaira, true)}</p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Link href="/wallet/withdraw" className="orange-fill flex h-11 items-center justify-center rounded-full font-bold">Withdraw</Link>
          <Link href="/wallet/add" className="flex h-11 items-center justify-center rounded-full border border-white/20 font-bold">+ Add Funds</Link>
        </div>
      </section>
      <div className="mt-4 grid grid-cols-4 gap-2 text-center text-[11px]">
        {[
          ["/wallet/gifts", "🎁", "My Gifts", user.giftsReceived],
          ["/wallet/earnings", "🪙", "Earnings"],
          ["/wallet/transactions", "🧾", "Transactions"],
          ["/wallet/payout", "🏦", "Payout Settings"],
        ].map(([href, icon, label, badge]) => (
          <Link key={String(href)} href={String(href)} className="card relative rounded-2xl px-1 py-3">
            <span className="text-lg">{icon}</span>
            {badge ? <span className="absolute right-2 top-2 rounded-full bg-[#ff3b30] px-1 text-[10px]">{badge}</span> : null}
            <span className="mt-1 block">{label}</span>
          </Link>
        ))}
      </div>
      <Link href="/pro" className="mt-4 flex items-center gap-3 rounded-3xl border border-[#ff9a1a]/40 p-3">
        <span>👑</span>
        <span className="flex-1 text-sm">
          <span className="block font-bold">Nochalant Club {user.isPro ? "PRO" : ""}</span>
          <span className="text-zinc-400">{user.isPro ? `Active · renews ${user.proRenewsAt ? new Date(user.proRenewsAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : ""}` : "Upgrade for bigger rooms and no ads."}</span>
        </span>
        <span className="text-sm font-bold">{user.isPro ? "Manage ›" : "Upgrade ›"}</span>
      </Link>
      <div className="mt-5 mb-2 flex items-center justify-between">
        <h2 className="font-extrabold">Recent Transactions</h2>
        <Link href="/wallet/transactions" className="text-sm font-bold text-[#ff7a00]">View All</Link>
      </div>
      <div className="space-y-2">
        {rows.slice(0, 5).map((row) => (
          <div key={row.id} className="card flex items-center justify-between rounded-2xl px-3 py-3">
            <div>
              <p className="font-bold">{row.title}</p>
              <p className="text-xs text-zinc-400">{row.detail}</p>
            </div>
            <div className="text-right">
              <p className={row.amountNaira >= 0 ? "font-bold text-green-400" : "font-bold text-red-400"}>{row.amountNaira >= 0 ? "+" : ""}{formatNaira(row.amountNaira)}</p>
              <p className="text-[11px] text-zinc-500">{relativeTime(row.createdAt)}</p>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
