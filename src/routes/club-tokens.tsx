import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { ClubPage } from "@/components/club/page";
import { Button } from "@/components/club/ui";
import { useClub } from "@/lib/club/store";

export const Route = createFileRoute("/club-tokens")({ component: Tokens });

const packs = [
  { amount: 40, label: "A round" },
  { amount: 120, label: "A night" },
  { amount: 300, label: "The table" },
];

function Tokens() {
  const tokens = useClub((state) => state.tokens);
  const ledger = useClub((state) => state.ledger);
  const addTokens = useClub((state) => state.addTokens);

  return (
    <ClubPage title="Club Tokens" kicker="For gifts, not cash" back="/gifts" tabs={false}>
      <p className="font-display text-5xl font-semibold tabular-nums">{tokens}</p>
      <p className="mt-2 text-sm text-secondary">
        Tokens buy gifts inside the Club. They are not withdrawable. Adding a pack here is a preview credit. Nothing is charged.
      </p>
      <div className="mt-5 flex flex-col gap-2">
        {packs.map((pack) => (
          <button
            key={pack.amount}
            type="button"
            className="flex items-center justify-between rounded-2xl border border-line px-4 py-3 text-left"
            onClick={() => {
              addTokens(pack.amount);
              toast(`${pack.amount} preview tokens added`);
            }}
          >
            <span>
              <span className="block font-semibold">{pack.label}</span>
              <span className="text-sm text-secondary">{pack.amount} tokens</span>
            </span>
            <span className="text-sm">Add</span>
          </button>
        ))}
      </div>
      <h2 className="mt-6 font-display text-lg font-semibold">Ledger</h2>
      {ledger.length === 0 ? <p className="mt-2 text-sm text-secondary">No movement yet.</p> : null}
      <ul className="mt-2 flex flex-col gap-2">
        {ledger.map((row) => (
          <li key={row.id} className="flex items-center justify-between text-sm">
            <span>{row.label}</span>
            <span className="tabular-nums">{row.amount > 0 ? `+${row.amount}` : row.amount}</span>
          </li>
        ))}
      </ul>
      <Button variant="ghost" full className="mt-6" onClick={() => toast("Checkout stays off until a real provider is connected.")}>
        Card checkout is off
      </Button>
    </ClubPage>
  );
}
