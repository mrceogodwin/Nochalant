import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Collectible } from "@/components/club/objects";
import { Stage } from "@/components/club/stage";
import { Button } from "@/components/club/ui";
import { personalities } from "@/lib/club/data";
import { useClub } from "@/lib/club/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/personality")({ component: PersonalityScreen });

function PersonalityScreen() {
  const selected = useClub((state) => state.personality);
  const setPersonality = useClub((state) => state.setPersonality);
  const navigate = useNavigate();
  const featured = personalities.slice(0, 6);
  const rest = personalities.slice(6);

  return (
    <Stage
      step={3}
      back="/role"
      kicker="A label, not a verdict"
      title="Choose your personality."
      subtitle="Playful profile language. Hide it later if you'd rather not wear it."
      footer={
        <div className="flex flex-col gap-3">
          <Button full disabled={!selected} onClick={() => void navigate({ to: "/interests" })}>
            Continue
          </Button>
          <Button variant="ghost" full onClick={() => void navigate({ to: "/interests" })}>
            Skip
          </Button>
        </div>
      }
    >
      <div className="-mx-5 flex gap-3 overflow-x-auto px-5 pb-2">
        {featured.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setPersonality(item.id)}
            className={cn(
              "w-36 shrink-0 rounded-3xl border p-3 text-left",
              selected === item.id ? "border-paper bg-card" : "border-line",
            )}
          >
            <span className="block w-20">
              <Collectible id={item.object} />
            </span>
            <span className="mt-2 block text-sm font-semibold">{item.name}</span>
            <span className="mt-1 block text-xs text-secondary">{item.line}</span>
          </button>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        {rest.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setPersonality(item.id)}
            className={cn(
              "rounded-3xl border p-3 text-left",
              selected === item.id ? "border-paper bg-card" : "border-line",
            )}
          >
            <span className="block w-14">
              <Collectible id={item.object} />
            </span>
            <span className="mt-2 block text-sm font-semibold">{item.name}</span>
          </button>
        ))}
      </div>
    </Stage>
  );
}
