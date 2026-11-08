"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Lock, Sparkles } from "lucide-react";

type IconItem = {
  id: string;
  name: string;
  description: string;
  category: string;
  rarity: string;
  svgPath: string;
  owned: boolean;
  selected: boolean;
  unlockable: boolean;
  unlockLabel: string;
};

const rarityLabel: Record<string, string> = {
  COMMON: "Common",
  UNCOMMON: "Uncommon",
  RARE: "Rare",
  EPIC: "Epic",
  LEGENDARY: "Legendary",
  FOUNDERS_EDITION: "Founders edition",
};

const rarityStyle: Record<string, string> = {
  COMMON: "border-white/10",
  UNCOMMON: "border-sky-300/30",
  RARE: "border-violet-300/40",
  EPIC: "border-rose-300/50",
  LEGENDARY: "border-amber-300/60",
  FOUNDERS_EDITION: "border-emerald-300/60",
};

export default function IdentityIconsPage() {
  const [icons, setIcons] = useState<IconItem[]>([]);
  const [category, setCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const response = await fetch("/api/icons", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "The identity collection is unavailable.");
    setIcons(data.icons ?? []);
  }, []);

  useEffect(() => {
    let live = true;
    fetch("/api/icons", { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "The identity collection is unavailable.");
        return data.icons as IconItem[];
      })
      .then((items) => { if (live) setIcons(items ?? []); })
      .catch((reason: unknown) => {
        if (live) setError(reason instanceof Error ? reason.message : "The identity collection is unavailable.");
      })
      .finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, []);

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(icons.map((icon) => icon.category))).sort()],
    [icons],
  );
  const visible = useMemo(
    () => icons.filter((icon) => category === "All" || icon.category === category),
    [icons, category],
  );
  const ownedCount = icons.filter((icon) => icon.owned).length;
  const selected = icons.find((icon) => icon.selected);

  async function performAction(icon: IconItem) {
    setBusyId(icon.id);
    setError("");
    try {
      const endpoint = icon.owned ? "/api/me/icons/select" : "/api/me/icons/unlock";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ iconId: icon.id }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "This identity could not be updated.");
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "This identity could not be updated.");
    } finally {
      setBusyId("");
    }
  }

  return (
    <main className="feed-shell">
      <header className="screen-heading">
        <Link href="/my-club" className="selection-hint">← My Club ID</Link>
        <h1>Identity Collection</h1>
        <p>Earn your symbols. Choose the one that represents your place in the Club.</p>
      </header>

      <section className="membership-row" aria-label="Collection progress">
        <div className="w-full">
          <div className="flex items-center justify-between gap-3">
            <strong>{ownedCount} of {icons.length} unlocked</strong>
            <span className="selection-hint">{selected ? `Wearing ${selected.name}` : "Choose your identity"}</span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-[#ed2939]" style={{ width: `${icons.length ? (ownedCount / icons.length) * 100 : 0}%` }} />
          </div>
        </div>
      </section>

      <div className="queue-heading">
        <h2>Club identities</h2>
        <span className="selection-hint">{visible.length} shown</span>
      </div>

      <div className="feed-tabs discover-filters" aria-label="Filter identity categories">
        {categories.map((item) => (
          <button key={item} className={category === item ? "selected" : ""} onClick={() => setCategory(item)}>{item}</button>
        ))}
      </div>

      {error ? <div className="empty-state" role="alert">{error}</div> : null}
      {loading ? <div className="empty-state" role="status">Loading your collection…</div> : (
        <div className="identity-icon-grid">
          {visible.map((item) => (
            <article key={item.id} className={`identity-icon-card ${item.selected ? "is-selected" : ""} ${rarityStyle[item.rarity] ?? ""}`}>
              <span className="identity-icon-art">
                <svg viewBox="0 0 64 64" role="img" aria-label={item.name}>
                  <use href={item.svgPath} />
                </svg>
              </span>
              <strong>{item.name}</strong>
              <small>{rarityLabel[item.rarity] ?? item.rarity.replaceAll("_", " ")}</small>
              <span className={item.owned ? "identity-owned" : "identity-locked"}>
                {item.selected ? "Selected" : item.owned ? "Unlocked" : "Locked"}
              </span>
              {item.owned ? (
                <button type="button" disabled={item.selected || busyId === item.id} onClick={() => void performAction(item)}>
                  {busyId === item.id ? "Saving…" : item.selected ? <><Check size={13} /> Wearing</> : "Wear identity"}
                </button>
              ) : (
                <button type="button" disabled={!item.unlockable || busyId === item.id} onClick={() => void performAction(item)}>
                  {busyId === item.id ? "Unlocking…" : item.unlockable ? <><Sparkles size={13} /> Unlock</> : <><Lock size={12} /> {item.unlockLabel}</>}
                </button>
              )}
            </article>
          ))}
        </div>
      )}

      <p className="selection-hint">Reputation and achievements unlock identities. Buying a membership never grants earned status or reputation XP.</p>
      <nav className="bottom-nav">
        <Link href="/club">⌂<small>Home</small></Link>
        <Link href="/discover">◉<small>Discover</small></Link>
        <Link className="create-button" href="/club/create">＋</Link>
        <Link href="/chats">▢<small>Chats</small></Link>
        <Link className="active" href="/my-club">♙<small>My Club</small></Link>
      </nav>
    </main>
  );
}
