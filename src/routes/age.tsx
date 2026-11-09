import { createFileRoute, Link } from "@tanstack/react-router";
import { ClubPage } from "@/components/club/page";

export const Route = createFileRoute("/age")({ component: AgePolicy });

function AgePolicy() {
  return (
    <ClubPage title="Age policy" kicker="18+ only" back="/settings" tabs={false}>
      <div className="flex flex-col gap-4 text-sm leading-relaxed text-secondary">
        <p>Nochalant Club is an adult room. You confirm you are 18 or older before the door opens. That confirmation stays on this device.</p>
        <p>There is no separate teen mode, no age exception, and no way to browse the Club as a minor. If you are under 18, leave.</p>
        <p>Members are expected to keep sexual content, gifts, and voice notes inside an adult context. Do not post anyone who is, or appears to be, under 18.</p>
        <p>This preview does not verify identity documents. A real membership check is not turned on here.</p>
        <Link to="/guidelines" className="underline">Community guidelines</Link>
      </div>
    </ClubPage>
  );
}
