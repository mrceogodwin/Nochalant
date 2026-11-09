import { createFileRoute } from "@tanstack/react-router";
import { SpaceList } from "@/components/club/space";

export const Route = createFileRoute("/squads/")({
  component: () => <SpaceList kind="squad" title="Squads" kicker="Private crews" />,
});
