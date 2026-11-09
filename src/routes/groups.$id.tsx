import { createFileRoute } from "@tanstack/react-router";
import { SpaceDetail } from "@/components/club/space";

export const Route = createFileRoute("/groups/$id")({
  component: function Group() {
    const { id } = Route.useParams();
    return <SpaceDetail kind="group" id={id} />;
  },
});
