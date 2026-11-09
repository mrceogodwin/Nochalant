import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Collectible } from "@/components/club/objects";
import { Stage } from "@/components/club/stage";
import { Button } from "@/components/club/ui";
import { roles } from "@/lib/club/data";
import { useClub } from "@/lib/club/store";
import type { RoleId } from "@/lib/club/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/role")({ component: RoleScreen });

function RoleScreen() {
  const role = useClub((state) => state.role);
  const setRole = useClub((state) => state.setRole);
  const navigate = useNavigate();

  return (
    <Stage
      step={2}
      back="/join"
      kicker="How you show up"
      title="Choose your role."
      subtitle="It isn't a rank. Change it whenever the night changes."
      footer={
        <Button
          full
          disabled={!role}
          onClick={() => {
            void navigate({ to: "/personality" });
          }}
        >
          Continue
        </Button>
      }
    >
      <div className="flex flex-col gap-3">
        {roles.map((item) => {
          const selected = role === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setRole(item.id as RoleId)}
              className={cn(
                "flex items-center gap-4 rounded-3xl border p-3 text-left",
                selected ? "border-paper bg-card" : "border-line bg-bg-2",
              )}
            >
              <span className="w-16 shrink-0">
                <Collectible id={item.object} />
              </span>
              <span>
                <span className="block font-display text-xl font-semibold">{item.name}</span>
                <span className="mt-1 block text-sm text-secondary">{item.line}</span>
              </span>
            </button>
          );
        })}
      </div>
    </Stage>
  );
}
