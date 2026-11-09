import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Collectible } from "@/components/club/objects";
import { Stage } from "@/components/club/stage";
import { Button, ButtonLink } from "@/components/club/ui";
import type { CollectibleId } from "@/lib/club/types";

export const Route = createFileRoute("/join")({ component: Invitation });

const slides: { object: CollectibleId; line: string; detail: string }[] = [
  {
    object: "crown",
    line: "Welcome to the Club.",
    detail: "A room for people who would rather talk than perform.",
  },
  {
    object: "bubble",
    line: "Say it, or send it.",
    detail: "Short voice notes, gifts, and rooms that don't need an audience.",
  },
  {
    object: "cards",
    line: "Your people. Your scene. Your rules.",
    detail: "Pick a personality. Keep the rest of you off the table.",
  },
];

function Invitation() {
  const [watching, setWatching] = useState(false);
  const [slide, setSlide] = useState(0);
  const current = slides[slide] ?? slides[0];

  return (
    <Stage
      step={1}
      back="/"
      kicker="The invitation"
      title="You've been invited to a different kind of social club."
      subtitle="Real people. Unexpected conversations. Your own kind of chaos."
      footer={
        <div className="flex flex-col gap-3">
          <ButtonLink to="/role" full>
            I'm in
          </ButtonLink>
          <Button variant="ghost" full onClick={() => setWatching(true)}>
            Watch the introduction
          </Button>
        </div>
      }
    >
      <div className="mx-auto w-36 py-2">
        <Collectible id="crown" />
      </div>
      {watching ? (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/80 sm:items-center">
          <div className="w-full max-w-md rounded-t-sheet bg-elevated px-6 pt-6 pb-8 sm:rounded-sheet">
            <div className="mx-auto w-36">
              <Collectible id={current.object} />
            </div>
            <h2 className="mt-4 font-display text-2xl font-semibold">{current.line}</h2>
            <p className="mt-2 text-secondary">{current.detail}</p>
            <div className="mt-6 flex gap-3">
              <Button variant="ghost" onClick={() => setWatching(false)}>
                Close
              </Button>
              <Button
                full
                onClick={() => {
                  if (slide >= slides.length - 1) setWatching(false);
                  else setSlide((value) => value + 1);
                }}
              >
                {slide >= slides.length - 1 ? "I'm in" : "Next"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </Stage>
  );
}
