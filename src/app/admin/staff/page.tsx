import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function AdminStaffPage() {
  await requireAdmin();
  const assignments = await prisma.adminAssignment.findMany({
    where: { revokedAt: null },
    orderBy: { grantedAt: "desc" },
    take: 100,
    select: { id: true, role: true, grantedAt: true, grantedBy: true, user: { select: { id: true, email: true, username: true, displayName: true, status: true } } },
  });
  return <main className="feed-shell admin-console">
    <header className="chat-header"><Link href="/admin">‹</Link><div><strong>Staff & permissions</strong><small>Super Admin · Access register</small></div><span className="admin-tag">PRIVATE</span></header>
    <section className="admin-welcome"><p className="onboard-kicker">ACCESS GOVERNANCE</p><h1>Who can<br/><em>run the Club.</em></h1><p>Current non-revoked staff assignments from the database. This register is read-only until safe role-grant and revocation workflows are implemented.</p></section>
    <p className="admin-member-count">{assignments.length} active staff assignments · latest 100</p>
    <section className="admin-member-list">{assignments.map(item=><article key={item.id}><div className="admin-member-avatar">{item.user.displayName.slice(0,1).toUpperCase()}</div><div className="admin-member-info"><strong>{item.user.displayName}</strong><small>@{item.user.username} · {item.user.email}</small><small>Granted {item.grantedAt.toLocaleDateString("en-NG")} · Account {item.user.status}</small></div><span className="admin-status">{item.role}</span></article>)}</section>
    <p className="admin-security-note">Role grants and revocations must prevent last-owner lockout, prevent privilege escalation, require recent re-authentication and write an audit record. Those write controls are intentionally not active yet.</p>
  </main>;
}
