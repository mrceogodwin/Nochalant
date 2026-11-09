import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ImageOff, Mic, Square } from "lucide-react";
import { toast } from "sonner";
import { Collectible } from "@/components/club/objects";
import { ClubFrame } from "@/components/club/shell";
import { Button } from "@/components/club/ui";
import { VoiceNote } from "@/components/club/voice";
import { emojiGroups } from "@/lib/club/data";
import { useClub } from "@/lib/club/store";
import type { CollectibleId, PostKind } from "@/lib/club/types";
import { useRecorder } from "@/lib/club/use-recorder";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/create")({ component: CreateScreen });

const kinds: { id: PostKind; label: string }[] = [
  { id: "text", label: "Note" },
  { id: "voice", label: "Voice" },
  { id: "poll", label: "Poll" },
  { id: "question", label: "Question" },
];

function CreateScreen() {
  const addPost = useClub((state) => state.addPost);
  const saveDraft = useClub((state) => state.saveDraft);
  const navigate = useNavigate();
  const [kind, setKind] = useState<PostKind>("text");
  const [text, setText] = useState("");
  const [left, setLeft] = useState("After Hours");
  const [right, setRight] = useState("Confessions");
  const [object, setObject] = useState<CollectibleId | null>(null);
  const recorder = useRecorder(60);

  function publish() {
    const body = text.trim();
    if (kind !== "voice" && !body) return;
    if (kind === "voice" && !recorder.url && !body) return;
    addPost({
      id: `mine-${Date.now()}`,
      authorId: "me",
      kind,
      text: body || "Voice note",
      time: "Now",
      likes: 0,
      mine: true,
      object: object ?? undefined,
      duration: kind === "voice" ? Math.max(recorder.seconds, 1) : undefined,
      preview: kind === "voice" ? !recorder.url : undefined,
      audio: kind === "voice" ? recorder.url ?? undefined : undefined,
      poll:
        kind === "poll"
          ? [
              { id: "a", label: left || "This", votes: 0 },
              { id: "b", label: right || "That", votes: 0 },
            ]
          : undefined,
    });
    toast("Posted to your Club");
    void navigate({ to: "/home" });
  }

  function keep() {
    if (!text.trim()) {
      toast(recorder.url ? "Recordings aren't kept as drafts. Publish this one." : "Write a line first.");
      return;
    }
    saveDraft({ kind, text: text.trim(), left, right, object });
    setText("");
    toast("Kept in Drafts");
  }

  return (
    <ClubFrame>
      <div className="mt-4 flex gap-2 overflow-x-auto px-4">
        {kinds.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setKind(item.id)}
            className={cn("h-9 rounded-full px-4 text-sm", kind === item.id ? "bg-paper font-semibold text-ink" : "bg-elevated text-secondary")}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="px-4 pt-4">
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder={kind === "question" ? "Ask the room one thing." : "Say it plain."}
          className="min-h-32 w-full resize-none bg-transparent font-display text-2xl outline-none placeholder:text-muted"
        />
        {kind === "poll" ? (
          <div className="mt-2 flex flex-col gap-2">
            <input value={left} onChange={(event) => setLeft(event.target.value)} className="h-12 rounded-2xl border border-line bg-card px-4 outline-none" />
            <input value={right} onChange={(event) => setRight(event.target.value)} className="h-12 rounded-2xl border border-line bg-card px-4 outline-none" />
          </div>
        ) : null}
        {kind === "voice" ? (
          <div className="mt-2 rounded-3xl border border-line p-4">
            {recorder.url ? <VoiceNote src={recorder.url} duration={Math.max(recorder.seconds, 1)} tone="dark" /> : null}
            <div className="mt-3 flex items-center gap-3">
              <button
                type="button"
                onClick={() => (recorder.recording ? recorder.stop() : void recorder.start())}
                className="inline-flex size-14 items-center justify-center rounded-full bg-paper text-ink"
                aria-label={recorder.recording ? "Stop recording" : "Record voice note"}
              >
                {recorder.recording ? <Square className="size-5" /> : <Mic className="size-6" />}
              </button>
              <div>
                <p className="font-medium">{recorder.recording ? "Recording" : recorder.url ? "Ready to send" : "Record a note"}</p>
                <p className="text-sm text-muted tabular-nums">0:{String(recorder.seconds).padStart(2, "0")} · 60s max</p>
              </div>
            </div>
            {recorder.error ? <p className="mt-3 text-sm text-secondary">{recorder.error}</p> : null}
          </div>
        ) : null}
        <p className="mt-5 text-sm text-secondary">Attach an object</p>
        <div className="mt-2 flex gap-2 overflow-x-auto">
          {emojiGroups[1]?.ids.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setObject((current) => (current === id ? null : id))}
              className={cn("w-16 shrink-0 rounded-2xl border p-1", object === id ? "border-paper" : "border-transparent")}
            >
              <Collectible id={id} />
            </button>
          ))}
        </div>
        <div className="mt-5 flex items-start gap-3 rounded-2xl border border-line px-4 py-3 text-sm text-secondary">
          <ImageOff className="mt-0.5 size-4 shrink-0" />
          Pictures and video stay off until the Club turns uploads on. Notes, voice, polls and questions are open.
        </div>
        <div className="mt-5 flex gap-2">
          <Button variant="ghost" className="flex-1" onClick={keep}>
            Draft
          </Button>
          <Button className="flex-1" onClick={publish} disabled={kind === "voice" ? !text.trim() && !recorder.url : !text.trim()}>
            Publish
          </Button>
        </div>
      </div>
    </ClubFrame>
  );
}
