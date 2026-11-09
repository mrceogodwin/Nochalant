import { useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Collectible } from "@/components/club/objects";
import { ClubPage } from "@/components/club/page";
import { notifications } from "@/lib/club/data";
import { useClub } from "@/lib/club/store";

export const Route = createFileRoute("/notifications")({ component: Notices });

function Notices() {
  const markNotifs = useClub((state) => state.markNotifs);
  useEffect(() => {
    markNotifs();
  }, [markNotifs]);

  return (
    <ClubPage title="Tonight" kicker="Notifications" back="/home" tabs={false}>
      <ul className="flex flex-col gap-3">
        {notifications.map((item) => (
          <li key={item.id} className="flex items-center gap-3 rounded-2xl bg-card p-3">
            <span className="w-12 shrink-0">
              <Collectible id={item.object} />
            </span>
            <span>
              <span className="block text-sm">{item.text}</span>
              <span className="text-xs text-muted">{item.time}</span>
            </span>
          </li>
        ))}
      </ul>
    </ClubPage>
  );
}
