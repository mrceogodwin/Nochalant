import { createFileRoute } from "@tanstack/react-router";
import { SpaceDetail } from "@/components/club/space";

export const Route = createFileRoute("/experiments/$id")({
  component: function Experiment() {
    const { id } = Route.useParams();
    return <SpaceDetail kind="experiment" id={id} />;
  },
});
