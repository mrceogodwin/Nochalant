import { createFileRoute } from "@tanstack/react-router";
import { SpaceDetail } from "@/components/club/space";

export const Route = createFileRoute("/squads/$id")({
  component: function Squad() {
    const { id } = Route.useParams();
    return <SpaceDetail kind="squad" id={id} />;
  },
});
