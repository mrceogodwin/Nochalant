import { respondInvite } from "@/lib/actions";
import { BackHeader } from "@/components/shell";
import { requireUser } from "@/lib/auth";
import { invites } from "@/lib/data";

export default async function InvitesPage() {
  const user = await requireUser();
  const rows = await invites(user.id);
  return (
    <main className="px-4 pt-2">
      <BackHeader back="/profile" />
      <h1 className="mt-4 text-3xl font-extrabold">Invites & Requests</h1>
      <div className="mt-4 space-y-3">
        {rows.map((invite) => (
          <div key={invite.id} className="card rounded-2xl p-3">
            <p className="font-bold">{invite.title}</p>
            <p className="text-sm text-zinc-300">{invite.body}</p>
            <p className="text-xs capitalize text-zinc-500">{invite.status}</p>
            {invite.status === "pending" ? (
              <div className="mt-2 flex gap-2">
                <form action={respondInvite.bind(null, invite.id, true)}><button className="orange-fill rounded-full px-3 py-1 text-sm font-bold">Accept</button></form>
                <form action={respondInvite.bind(null, invite.id, false)}><button className="rounded-full border border-white/15 px-3 py-1 text-sm">Decline</button></form>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </main>
  );
}
