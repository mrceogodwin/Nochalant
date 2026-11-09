import { createFileRoute } from "@tanstack/react-router";
import { ClubPage } from "@/components/club/page";
import { members, posts } from "@/lib/club/data";
import { useClub } from "@/lib/club/store";

export const Route = createFileRoute("/admin")({ component: Desk });

function Desk() {
  const myPosts = useClub((state) => state.myPosts);
  const gifts = useClub((state) => state.sentGifts);
  const reports = useClub((state) => state.reports);
  const joined = useClub((state) => state.joined);
  const blocked = useClub((state) => state.blocked);
  const stats = [
    { label: "Members in the scene", value: members.length },
    { label: "Hidden by you", value: blocked.length },
    { label: "Posts", value: posts.length + myPosts.length },
    { label: "Gifts you sent", value: gifts.length },
    { label: "Rooms you joined", value: joined.length },
    { label: "Reports", value: reports.length },
  ];

  return (
    <ClubPage title="Club desk" kicker="This device only" back="/settings" tabs={false}>
      <p className="text-sm text-secondary">
        Counts come from the scene on this device. They are not live platform totals.
      </p>
      <dl className="mt-4 grid grid-cols-2 gap-2">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-2xl bg-card p-3">
            <dt className="text-xs text-muted">{stat.label}</dt>
            <dd className="font-display text-2xl tabular-nums">{stat.value}</dd>
          </div>
        ))}
      </dl>
      <h2 className="mt-6 font-display text-lg font-semibold">Reports</h2>
      {reports.length === 0 ? <p className="mt-2 text-sm text-secondary">The queue is empty.</p> : null}
      <ul className="mt-2 flex flex-col gap-2">
        {reports.map((report) => (
          <li key={report.id} className="rounded-2xl border border-line px-3 py-2 text-sm">
            <span className="font-medium">{report.name}</span>
            <span className="text-secondary"> · {report.reason}</span>
          </li>
        ))}
      </ul>
    </ClubPage>
  );
}
