import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Collectible } from "@/components/club/objects";
import { ClubPage } from "@/components/club/page";
import { GiftSheet } from "@/components/club/sheets";
import { collectibleNames, costOf, giftCatalogue } from "@/lib/club/data";
import { useClub } from "@/lib/club/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/gifts")({ component: Gifts });

const tabs = ["Catalogue", "Received", "Sent"] as const;

function Gifts() {
  const [tab, setTab] = useState<(typeof tabs)[number]>("Catalogue");
  const [open, setOpen] = useState(false);
  const received = useClub((state) => state.gifts);
  const sent = useClub((state) => state.sentGifts);
  const tokens = useClub((state) => state.tokens);

  return (
    <ClubPage title="Gifts" kicker={`${tokens} tokens`}>
      <div className="flex gap-2">
        {tabs.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setTab(item)}
            className={cn("h-9 rounded-full px-4 text-sm", tab === item ? "bg-paper font-semibold text-ink" : "bg-elevated text-secondary")}
          >
            {item}
          </button>
        ))}
      </div>
      {tab === "Catalogue" ? (
        <>
          <div className="mt-4 grid grid-cols-3 gap-3">
            {giftCatalogue.map((gift) => (
              <button key={gift.id} type="button" onClick={() => setOpen(true)} className="rounded-2xl border border-line p-2 text-center">
                <Collectible id={gift.id} />
                <span className="mt-1 block text-xs">{gift.name}</span>
                <span className="text-xs text-muted tabular-nums">{costOf(gift.id)}</span>
              </button>
            ))}
          </div>
          <Link to="/club-tokens" className="mt-4 block text-sm text-secondary underline">
            Club Tokens
          </Link>
        </>
      ) : null}
      {tab === "Received" ? (
        <div className="mt-4 flex flex-col gap-3">
          {received.length === 0 ? <p className="text-sm text-secondary">Nothing received yet.</p> : null}
          {received.map((gift) => (
            <div key={gift.id} className="flex items-center gap-3">
              <span className="w-14">
                <Collectible id={gift.object} />
              </span>
              <span>
                <span className="block text-sm font-medium">{collectibleNames[gift.object]}</span>
                <span className="block text-xs text-muted">{gift.note}</span>
              </span>
            </div>
          ))}
        </div>
      ) : null}
      {tab === "Sent" ? (
        <div className="mt-4 flex flex-col gap-3">
          {sent.length === 0 ? <p className="text-sm text-secondary">You haven't sent a gift yet.</p> : null}
          {sent.map((gift) => (
            <div key={gift.id} className="flex items-center gap-3">
              <span className="w-14">
                <Collectible id={gift.object} />
              </span>
              <span>
                <span className="block text-sm font-medium">{collectibleNames[gift.object]}</span>
                <span className="block text-xs text-muted">{gift.note}</span>
              </span>
            </div>
          ))}
        </div>
      ) : null}
      <GiftSheet open={open} onOpenChange={setOpen} to="the room" />
    </ClubPage>
  );
}
