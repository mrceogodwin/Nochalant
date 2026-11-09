import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Mic, Send, Square } from "lucide-react";
import { Collectible } from "@/components/club/objects";
import { GiftSheet } from "@/components/club/sheets";
import { ClubFrame } from "@/components/club/shell";
import { VoiceNote } from "@/components/club/voice";
import { collectibleNames, emojiGroups, memberById, threads } from "@/lib/club/data";
import { useClub } from "@/lib/club/store";
import type { ChatMessage } from "@/lib/club/types";
import { useRecorder } from "@/lib/club/use-recorder";
import { cn } from "@/lib/utils";

const emptyThread: ChatMessage[] = [];

export const Route = createFileRoute("/chats/$id")({ component: ThreadScreen });

function ThreadScreen() {
  const { id } = Route.useParams();
  const member = memberById(id);
  const thread = threads.find((item) => item.id === id) ?? (member ? { id: member.id, title: member.name, object: member.object, time: "" } : null);
  const messages = useClub((state) => state.messages[id] ?? emptyThread);
  const sendMessage = useClub((state) => state.sendMessage);
  const [text, setText] = useState("");
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [giftOpen, setGiftOpen] = useState(false);
  const recorder = useRecorder(60);

  if (!thread) {
    return (
      <ClubFrame tabs={false}>
        <p className="px-5 py-16 text-center text-secondary">That conversation isn't in the Club.</p>
        <Link to="/chats" className="block text-center underline">
          Back to chats
        </Link>
      </ClubFrame>
    );
  }

  return (
    <ClubFrame tabs={false} title={thread.title} kicker="Voice stays in the thread" back="/chats" scroll={false}>
      <div className="flex h-full min-h-0 flex-col">
        <div className="app-scroll flex min-h-0 flex-1 flex-col gap-3 px-4 py-4">
          {messages.map((message) => (
            <div key={message.id} className={cn("flex", message.from === "me" ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[80%] rounded-3xl px-4 py-3",
                  message.from === "me" ? "bg-paper text-ink" : "bg-card text-fg",
                )}
              >
                {message.object ? (
                  <div className="mb-2 w-20">
                    <Collectible id={message.object} />
                    <p className="text-xs opacity-70">{collectibleNames[message.object]}</p>
                  </div>
                ) : null}
                {message.audio ? <VoiceNote src={message.audio} duration={message.duration} tone={message.from === "me" ? "light" : "dark"} /> : null}
                {message.text ? <p className="text-sm">{message.text}</p> : null}
                <p className={cn("mt-1 text-xs", message.from === "me" ? "text-ink/60" : "text-muted")}>{message.at}</p>
              </div>
            </div>
          ))}
        </div>
        {emojiOpen ? (
          <div className="mx-4 mb-3 grid shrink-0 grid-cols-5 gap-2 rounded-3xl border border-line bg-elevated p-3">
            {emojiGroups.flatMap((group) => group.ids).slice(0, 10).map((object) => (
              <button
                key={object}
                type="button"
                onClick={() => {
                  sendMessage(id, { object, text: collectibleNames[object] });
                  setEmojiOpen(false);
                }}
              >
                <Collectible id={object} />
              </button>
            ))}
          </div>
        ) : null}
        <form
          className="flex shrink-0 items-center gap-2 border-t border-line bg-bg px-3 py-3"
          onSubmit={(event) => {
            event.preventDefault();
            const next = text.trim();
            if (!next && !recorder.url) return;
            sendMessage(id, {
              text: next || undefined,
              audio: recorder.url ?? undefined,
              duration: recorder.url ? Math.max(recorder.seconds, 1) : undefined,
            });
            setText("");
            recorder.reset();
          }}
        >
          <button type="button" aria-label="Objects" onClick={() => setEmojiOpen((value) => !value)} className="text-sm text-secondary">
            Objects
          </button>
          <button type="button" className="text-sm text-secondary" onClick={() => setGiftOpen(true)}>
            Gift
          </button>
          <input
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Message"
            className="h-11 flex-1 rounded-full border border-line bg-card px-4 text-sm outline-none"
          />
          <button
            type="button"
            aria-label={recorder.recording ? "Stop recording" : "Record"}
            onClick={() => (recorder.recording ? recorder.stop() : void recorder.start())}
            className="inline-flex size-11 items-center justify-center rounded-full border border-line"
          >
            {recorder.recording ? <Square className="size-4" /> : <Mic className="size-4" />}
          </button>
          <button type="submit" aria-label="Send" className="inline-flex size-11 items-center justify-center rounded-full bg-paper text-ink">
            <Send className="size-4" />
          </button>
        </form>
        {recorder.error ? <p className="shrink-0 px-4 pb-3 text-xs text-secondary">{recorder.error}</p> : null}
        <GiftSheet open={giftOpen} onOpenChange={setGiftOpen} to={id} />
      </div>
    </ClubFrame>
  );
}
