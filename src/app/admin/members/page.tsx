import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function AdminMembersPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string }> }) {
  await requireAdmin();
  const params = await searchParams;
  const query = (params.q || "").trim().slice(0, 80);
  const status = ["ACTIVE", "SUSPENDED", "BANNED", "DELETED"].includes(params.status || "") ? params.status as "ACTIVE" | "SUSPENDED" | "BANNED" | "DELETED" : undefined;
  const where = {
    ...(status ? { status } : {}),
    ...(query ? { OR: [{ email: { contains: query, mode: "insensitive" as const } }, { username: { contains: query, mode: "insensitive" as const } }, { displayName: { contains: query, mode: "insensitive" as const } }] } : {}),
  };
  const [users, total] = await Promise.all([
    prisma.user.findMany({ where, orderBy: { createdAt: "desc" }, take: 50, select: { id: true, email: true, username: true, displayName: true, status: true, createdAt: true, emailVerifiedAt: true } }),
    prisma.user.count({ where }),
  ]);
  return <main className="feed-shell admin-console">
    <header className="chat-header"><Link href="/admin">‹</Link><div><strong>Member directory</strong><small>Super Admin · Account overview</small></div><span className="admin-tag">PRIVATE</span></header>
    <section className="admin-welcome"><p className="onboard-kicker">MEMBER OPERATIONS</p><h1>People in<br/><em>the Club.</em></h1><p>Search verified account records and review account status. This view is read-only; enforcement actions are not exposed until their audited workflows are ready.</p></section>
    <form className="admin-member-search" action="/admin/members"><input name="q" defaultValue={query} placeholder="Search email, username or display name" maxLength={80}/><select name="status" defaultValue={status || ""}><option value="">All statuses</option><option value="ACTIVE">Active</option><option value="SUSPENDED">Suspended</option><option value="BANNED">Banned</option><option value="DELETED">Deleted</option></select><button type="submit">Search</button></form>
    <p className="admin-member-count">{total.toLocaleString("en-NG")} matching accounts · showing {users.length}</p>
    <section className="admin-member-list">{users.map(user=><article key={user.id}><div className="admin-member-avatar">{user.displayName.slice(0,1).toUpperCase()}</div><div className="admin-member-info"><strong>{user.displayName}</strong><small>@{user.username} · {user.email}</small><small>Joined {user.createdAt.toLocaleDateString("en-NG")} · {user.emailVerifiedAt ? "Email verified" : "Unverified"}</small></div><span className={"admin-status status-"+user.status.toLowerCase()}>{user.status}</span></article>)}</section>
    <p className="admin-security-note">Account status changes will be added only after suspension expiry, ban appeals, session revocation, notifications and immutable audit logging are connected.</p>
  </main>;
}
