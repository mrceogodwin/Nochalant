import { requireUser } from "@/lib/auth";
import { receivedGifts } from "@/lib/data";
import { BackHeader } from "@/components/shell";
import { formatNaira, relativeTime } from "@/lib/format";

export default async function MyGiftsPage() {
  const user = await requireUser();
  const gifts = await receivedGifts(user.id);
  return (
    <main className="px-4 pt-2">
      <BackHeader back="/wallet" />
      <h1 className="mt-4 text-3xl font-extrabold">My Gifts</h1>
      <div className="mt-4 space-y-2">
        {gifts.map((gift, index) => (
          <div key={`${gift.name}-${index}`} className="card flex items-center justify-between rounded-2xl px-3 py-3">
            <div>
              <p className="font-bold">{gift.emoji} {gift.name}</p>
              <p className="text-xs text-zinc-400">From {gift.fromName} · {relativeTime(gift.createdAt)}</p>
            </div>
            <p className="font-bold text-green-400">+{formatNaira(gift.amount)}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
