import { createFileRoute } from "@tanstack/react-router";
import { SpaceDetail } from "@/components/club/space";

export const Route = createFileRoute("/rooms/$id")({
  component: function Room() {
    const { id } = Route.useParams();
    return <SpaceDetail kind="room" id={id} />;
  },
});
