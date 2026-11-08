"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RevokeBadgeButton({ userBadgeId, revoked }: { userBadgeId: string; revoked: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function revoke() {
    const reason = window.prompt("Why is this badge being revoked? This reason is recorded in the audit log.");
    if (reason === null) return;
    if (reason.trim().length < 8) {
      setError("Enter a clear reason of at least 8 characters.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/badges/${userBadgeId}/revoke`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason.trim() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Badge revocation failed.");
      router.refresh();
    } catch (reasonError) {
      setError(reasonError instanceof Error ? reasonError.message : "Badge revocation failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button type="button" disabled={revoked || busy} onClick={() => void revoke()} className="rounded-full border border-rose-400/30 px-3 py-1.5 text-[10px] font-bold text-rose-200 disabled:opacity-40">
        {revoked ? "Revoked" : busy ? "Saving…" : "Revoke badge"}
      </button>
      {error ? <small className="max-w-36 text-right text-[10px] text-rose-300">{error}</small> : null}
    </div>
  );
}
