import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Collectible } from "@/components/club/objects";
import { Stage } from "@/components/club/stage";
import { Button } from "@/components/club/ui";
import { interestOptions } from "@/lib/club/data";
import { useClub } from "@/lib/club/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/interests")({ component: InterestsScreen });

function InterestsScreen() {
  const selected = useClub((state) => state.interests);
  const toggle = useClub((state) => state.toggleInterest);
  const navigate = useNavigate();

  return (
    <Stage
      step={4}
      back="/personality"
      title="What are you actually here for?"
      subtitle="Pick a few. The Club uses them to suggest rooms, not to box you in."
      footer={
        <Button full onClick={() => void navigate({ to: "/identity" })}>
          {selected.length ? "Continue" : "Skip for now"}
        </Button>
      }
    >
      <div className="flex flex-wrap gap-2">
        {interestOptions.map((item) => {
          const on = selected.includes(item.id);
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => toggle(item.id)}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border py-1 pr-4 pl-1",
                on ? "border-paper bg-paper text-ink" : "border-line text-fg",
              )}
            >
              <span className="w-9">
                <Collectible id={item.object} />
              </span>
              <span className="text-sm font-medium">{item.name}</span>
            </button>
          );
        })}
      </div>
    </Stage>
  );
}
