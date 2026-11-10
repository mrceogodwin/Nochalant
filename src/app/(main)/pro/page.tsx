import { Mascot } from "@/components/brand";
import { PlanPicker } from "@/components/forms";
import { BackHeader } from "@/components/shell";
import { PERKS } from "@/lib/catalog";
import { requireUser } from "@/lib/auth";

export default async function ProPage() {
  const user = await requireUser();
  return (
    <main className="px-4 pt-2">
      <BackHeader back="/profile" />
      <div className="relative">
        <h1 className="mt-3 text-4xl font-extrabold leading-none">Upgrade to Nochalant Club <span className="rounded-full bg-[#ff2d2d] px-2 py-0.5 text-sm align-middle">PRO</span></h1>
        <p className="mt-2 max-w-[230px] text-sm text-zinc-300">Unlock premium features, bigger rooms, more control and an exclusive experience.</p>
        <span className="absolute right-0 top-8"><Mascot size={100} /></span>
      </div>
      <div className="mt-4 grid grid-cols-4 gap-2">
        {PERKS.map((perk) => (
          <div key={perk.title} className="card rounded-2xl p-2 text-center">
            <p className="text-lg">✦</p>
            <p className="text-[11px] font-bold leading-tight">{perk.title}</p>
            {perk.detail ? <p className="text-[10px] text-zinc-400">{perk.detail}</p> : null}
          </div>
        ))}
      </div>
      <div className="mt-6">
        {user.isPro ? <p className="mb-3 text-sm text-[#ffb000]">You’re on the {user.proPlan} plan.</p> : null}
        <PlanPicker />
      </div>
      <p className="mt-3 text-center text-xs text-zinc-400">Secure payment via Paystack</p>
      <details className="card mt-4 rounded-2xl px-4 py-3">
        <summary className="cursor-pointer font-bold">What’s included in Pro?</summary>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-zinc-300">
          <li>Scenes up to 5,000 listeners</li>
          <li>More groups, better audio, creator insights</li>
          <li>Pro badge, no ads, priority support</li>
        </ul>
      </details>
      <details className="card mt-2 rounded-2xl px-4 py-3">
        <summary className="cursor-pointer font-bold">Frequently Asked Questions</summary>
        <p className="mt-2 text-sm text-zinc-300">Plans renew until you cancel. Test mode completes a local upgrade when Paystack keys are absent. With PAYSTACK_SECRET_KEY, checkout opens Paystack and the webhook marks the plan paid.</p>
      </details>
    </main>
  );
}
