import { createFileRoute } from "@tanstack/react-router";
import { ClubPage } from "@/components/club/page";
import { Feed } from "@/components/club/feed";

export const Route = createFileRoute("/voice")({
  component: Voice,
});

function Voice() {
  return (
    <ClubPage title="Voice" kicker="Press play. Nothing starts itself.">
      <p className="mb-2 text-sm text-secondary">
        Notes from the room. Preview marks a scene with no recording attached. Your own notes play back for this session.
      </p>
      <div className="-mx-4">
        <Feed filter="voice" />
      </div>
    </ClubPage>
  );
}
