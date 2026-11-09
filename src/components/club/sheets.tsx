import { useState, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Drawer } from "vaul";
import { toast } from "sonner";
import { Collectible, giftMotion } from "@/components/club/objects";
import { Button } from "@/components/club/ui";
import { costOf, giftCatalogue, memberById, notifications } from "@/lib/club/data";
import { useClub } from "@/lib/club/store";
import type { CollectibleId, Comment } from "@/lib/club/types";

const emptyComments: Comment[] = [];

export function Sheet({
  open,
  onOpenChange,
  title,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
}) {
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-black/70" />
        <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 mx-auto max-h-[85dvh] w-full max-w-lg rounded-t-sheet border border-line bg-elevated px-5 pb-8 outline-none">
          <Drawer.Handle className="mx-auto mt-3 mb-4 h-1 w-10 rounded-full bg-line" />
          <Drawer.Title className="font-display text-xl font-semibold">{title}</Drawer.Title>
          <div className="mt-4 overflow-y-auto">{children}</div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

export function AgeSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const confirmAge = useClub((state) => state.confirmAge);
  const navigate = useNavigate();
  const [adult, setAdult] = useState(false);
  const [terms, setTerms] = useState(false);

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Strictly 18+">
      <p className="text-secondary">
        Nochalant Club is an adult social room. Confirm your age and the house rules before the door opens.
      </p>
      <label className="mt-4 flex items-start gap-3 text-sm">
        <input type="checkbox" checked={adult} onChange={(event) => setAdult(event.target.checked)} className="mt-1 size-4" />
        I am 18 or older.
      </label>
      <label className="mt-3 flex items-start gap-3 text-sm">
        <input type="checkbox" checked={terms} onChange={(event) => setTerms(event.target.checked)} className="mt-1 size-4" />
        <span>
          I agree to the <a className="underline" href="/terms">terms</a>,{" "}
          <a className="underline" href="/privacy">privacy</a> and{" "}
          <a className="underline" href="/guidelines">community guidelines</a>.
        </span>
      </label>
      <Button
        full
        className="mt-6"
        disabled={!adult || !terms}
        onClick={() => {
          confirmAge();
          onOpenChange(false);
          void navigate({ to: "/join" });
        }}
      >
        Enter the Club
      </Button>
    </Sheet>
  );
}

export function NotifSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const markNotifs = useClub((state) => state.markNotifs);
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Tonight">
      <ul className="flex flex-col gap-3">
        {notifications.map((item) => (
          <li key={item.id} className="flex items-center gap-3 rounded-2xl bg-card p-3">
            <span className="w-12 shrink-0">
              <Collectible id={item.object} />
            </span>
            <span>
              <span className="block text-sm">{item.text}</span>
              <span className="text-xs text-muted">{item.time}</span>
            </span>
          </li>
        ))}
      </ul>
      <Button
        variant="ghost"
        full
        className="mt-4"
        onClick={() => {
          markNotifs();
          onOpenChange(false);
        }}
      >
        Mark read
      </Button>
    </Sheet>
  );
}

export function GiftSheet({
  open,
  onOpenChange,
  to,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  to: string;
}) {
  const sendGift = useClub((state) => state.sendGift);
  const tokens = useClub((state) => state.tokens);
  const [picked, setPicked] = useState<CollectibleId | null>(null);
  const [note, setNote] = useState("");
  const [playing, setPlaying] = useState<CollectibleId | null>(null);
  const name = to === "the room" ? "the room" : (memberById(to)?.name ?? to);

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange} title={`Gift ${name}`}>
        <div className="grid grid-cols-3 gap-3">
          {giftCatalogue.map((gift) => (
            <button
              key={gift.id}
              type="button"
              onClick={() => setPicked(gift.id)}
              className={`rounded-2xl border p-2 text-center ${picked === gift.id ? "border-paper bg-card" : "border-line"}`}
            >
              <Collectible id={gift.id} />
              <span className="mt-1 block text-xs">{gift.name}</span>
              <span className="text-xs text-muted tabular-nums">{costOf(gift.id)}</span>
            </button>
          ))}
        </div>
        <input
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Add a line, or don't."
          className="mt-4 h-12 w-full rounded-2xl border border-line bg-card px-4 text-sm outline-none"
        />
        <p className="mt-3 text-xs text-muted tabular-nums">{tokens} tokens left</p>
        <Button
          full
          className="mt-4"
          disabled={!picked}
          onClick={() => {
            if (!picked) return;
            const sent = sendGift({ to: name, object: picked, note });
            if (!sent) {
              toast("Not enough Club Tokens");
              return;
            }
            setPlaying(picked);
            onOpenChange(false);
            window.setTimeout(() => setPlaying(null), 1400);
            toast("Gift sent");
          }}
        >
          Send gift{picked ? ` · ${costOf(picked)}` : ""}
        </Button>
      </Sheet>
      {playing ? (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/75">
          <div className={`w-40 ${giftMotion(playing)}`}>
            <Collectible id={playing} />
          </div>
          <p className="mt-4 font-display text-xl">Sent.</p>
        </div>
      ) : null}
    </>
  );
}

export function CommentSheet({
  open,
  onOpenChange,
  postId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId: string;
}) {
  const comments = useClub((state) => state.comments[postId] ?? emptyComments);
  const addComment = useClub((state) => state.addComment);
  const [text, setText] = useState("");

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Replies">
      <ul className="flex flex-col gap-3">
        {comments.length === 0 ? <li className="text-sm text-secondary">No replies yet. Say the first thing.</li> : null}
        {comments.map((comment) => {
          const author = comment.authorId === "me" ? "You" : (memberById(comment.authorId)?.name ?? "Member");
          return (
            <li key={comment.id} className="rounded-2xl bg-card px-3 py-2">
              <p className="text-sm font-semibold">{author}</p>
              <p className="text-sm text-secondary">{comment.text}</p>
            </li>
          );
        })}
      </ul>
      <form
        className="mt-4 flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          const next = text.trim();
          if (!next) return;
          addComment(postId, next);
          setText("");
        }}
      >
        <input
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Reply"
          className="h-12 flex-1 rounded-full border border-line bg-card px-4 text-sm outline-none"
        />
        <Button type="submit">Send</Button>
      </form>
    </Sheet>
  );
}

export function ReportSheet({
  open,
  onOpenChange,
  name,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  name: string;
}) {
  const addReport = useClub((state) => state.addReport);
  const reasons = ["Harassment", "Spam", "Privacy", "Something else"];
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title={`Report ${name}`}>
      <div className="flex flex-col gap-2">
        {reasons.map((reason) => (
          <button
            key={reason}
            type="button"
            className="h-12 rounded-2xl border border-line px-4 text-left text-sm"
            onClick={() => {
              addReport({ name, reason });
              toast("Report saved on this device");
              onOpenChange(false);
            }}
          >
            {reason}
          </button>
        ))}
      </div>
    </Sheet>
  );
}
