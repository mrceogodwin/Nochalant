import { createFileRoute } from "@tanstack/react-router";
import { SpaceList } from "@/components/club/space";

export const Route = createFileRoute("/experiments/")({
  component: () => <SpaceList kind="experiment" title="Experiments" kicker="The night has rules" />,
});
