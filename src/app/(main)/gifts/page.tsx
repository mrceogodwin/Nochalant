import Link from "next/link";
import { Mascot } from "@/components/brand";
import { GiftForm } from "@/components/forms";
import { BackHeader } from "@/components/shell";
import { requireUser } from "@/lib/auth";
import { listGifts, listPeople } from "@/lib/data";
import { formatNaira } from "@/lib/format";

const cats = ["popular", "love", "luxury", "fun", "support"];

export default async function GiftsPage({ searchParams }: { searchParams: Promise<{ cat?: string; scene?: string }> }) {
  const user = await requireUser();
  const params = await searchParams;
  const cat = params.cat || "popular";
  const [gifts, people] = await Promise.all([listGifts(), listPeople(user.id)]);
  const shown = gifts.filter((gift) => cat === "popular" || gift.category === cat);
  return (
    <main className="px-4 pt-2">
      <BackHeader back="/home" />
      <div className="relative">
        <h1 className="mt-3 text-4xl font-extrabold leading-none">Gifts & Rewards</h1>
        <p className="mt-1 max-w-[230px] text-sm text-zinc-300">Send gifts, show love, support creators and unlock special perks.</p>
        <span className="absolute right-0 top-0"><Mascot size={96} /></span>
      </div>
      <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto">
        {cats.map((item) => (
          <Link key={item} href={`/gifts?cat=${item}${params.scene ? `&scene=${params.scene}` : ""}`} className={`rounded-full px-3 py-1.5 text-sm font-bold capitalize ${cat === item ? "orange-fill text-black" : "bg-white/5"}`}>
            {item === "popular" ? "🔥 Popular" : item}
          </Link>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-4 gap-2">
        {shown.map((gift) => (
          <div key={gift.id} className="card rounded-2xl p-2 text-center">
            <div className="text-3xl">{gift.emoji}</div>
            <p className="mt-1 text-xs font-bold">{gift.name}</p>
            <p className="text-[11px] text-[#ffb000]">{formatNaira(gift.priceNaira)}</p>
          </div>
        ))}
      </div>
      <div className="mt-5">
        <GiftForm people={people.map((person) => ({ id: person.id, name: person.displayName }))} sceneId={params.scene} balance={user.walletNaira} />
      </div>
      <Link href="/leaderboard" className="mt-4 flex items-center justify-between rounded-3xl border border-[#ff9a1a]/40 bg-gradient-to-r from-[#3a1600] to-black p-4">
        <span>
          <span className="block font-extrabold">Top Gifter</span>
          <span className="text-sm text-zinc-300">Get a special badge, profile highlight and extra rewards.</span>
        </span>
        <span className="text-sm font-bold">View Leaderboard ›</span>
      </Link>
    </main>
  );
}
