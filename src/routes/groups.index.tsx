import { createFileRoute } from "@tanstack/react-router";
import { SpaceList } from "@/components/club/space";

export const Route = createFileRoute("/groups/")({
  component: () => <SpaceList kind="group" title="Groups" kicker="Shared interests" />,
});
