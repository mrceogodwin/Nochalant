import { createFileRoute } from "@tanstack/react-router";
import { SpaceList } from "@/components/club/space";

export const Route = createFileRoute("/rooms/")({
  component: () => <SpaceList kind="room" title="Rooms" kicker="Open doors" />,
});
