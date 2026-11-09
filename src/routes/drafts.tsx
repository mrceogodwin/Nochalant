import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Collectible } from "@/components/club/objects";
import { ClubPage } from "@/components/club/page";
import { Button } from "@/components/club/ui";
import { useClub } from "@/lib/club/store";
import type { Draft } from "@/lib/club/types";

export const Route = createFileRoute("/drafts")({ component: Drafts });

function Drafts() {
  const drafts = useClub((state) => state.drafts);
  const removeDraft = useClub((state) => state.removeDraft);
  const addPost = useClub((state) => state.addPost);
  const navigate = useNavigate();

  function publish(draft: Draft) {
    addPost({
      id: `mine-${Date.now()}`,
      authorId: "me",
      kind: draft.kind,
      text: draft.text,
      time: "Now",
      likes: 0,
      mine: true,
      object: draft.object ?? undefined,
      preview: draft.kind === "voice" ? true : undefined,
      poll:
        draft.kind === "poll"
          ? [
              { id: "a", label: draft.left || "This", votes: 0 },
              { id: "b", label: draft.right || "That", votes: 0 },
            ]
          : undefined,
    });
    removeDraft(draft.id);
    toast("Posted to your Club");
    void navigate({ to: "/home" });
  }

  return (
    <ClubPage title="Drafts" kicker="Not posted" back="/my-club" tabs={false}>
      {drafts.length === 0 ? <p className="text-secondary">Nothing waiting. Drafts stay on this device.</p> : null}
      <ul className="flex flex-col gap-3">
        {drafts.map((draft) => (
          <li key={draft.id} className="rounded-3xl border border-line p-4">
            <p className="text-xs tracking-widest text-muted">{draft.kind.toUpperCase()} · {draft.time}</p>
            <p className="mt-2">{draft.text}</p>
            {draft.object ? (
              <span className="mt-3 block w-16">
                <Collectible id={draft.object} />
              </span>
            ) : null}
            {draft.kind === "voice" ? (
              <p className="mt-2 text-xs text-muted">The recording itself is not stored with a draft.</p>
            ) : null}
            <div className="mt-4 flex gap-2">
              <Button className="h-10 flex-1" onClick={() => publish(draft)}>
                Publish
              </Button>
              <Button variant="ghost" className="h-10 flex-1" onClick={() => removeDraft(draft.id)}>
                Delete
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </ClubPage>
  );
}
