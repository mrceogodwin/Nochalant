import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function Metric({ label, value, detail }: { label: string; value: number; detail: string }) {
  return (
    <article className="admin-metric">
      <span>{label}</span>
      <strong>{value.toLocaleString("en-NG")}</strong>
      <small>{detail}</small>
    </article>
  );
}

export default async function AdminDashboard() {
  const [members, activeMembers, scenes, squads, openReports, openCases, payments, staff, recentAudit] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { status: "ACTIVE" } }),
    prisma.scene.count({ where: { active: true } }),
    prisma.squad.count(),
    prisma.contentReport.count({ where: { status: { in: ["OPEN", "REVIEWING", "APPEALED"] } } }),
    prisma.moderationCase.count({ where: { status: { in: ["OPEN", "REVIEWING", "APPEALED"] } } }),
    prisma.paymentTransaction.count(),
    prisma.adminAssignment.count({ where: { revokedAt: null } }),
    prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 8, select: { id: true, action: true, targetType: true, targetId: true, createdAt: true } }),
  ]);

  return (
    <main className="feed-shell admin-console">
      <header className="chat-header admin-header">
        <Link href="/club">‹</Link>
        <div><strong>Nochalant Control</strong><small>Super Admin · Operations console</small></div>
        <span className="admin-tag">RESTRICTED</span>
      </header>
      <section className="admin-welcome">
        <p className="onboard-kicker">PLATFORM COMMAND</p>
        <h1>Control the<br/><em>whole Club.</em></h1>
        <p>Live operational overview from the connected database. Sensitive actions remain permission-gated and audited.</p>
      </section>
      <section className="admin-metrics-grid" aria-label="Platform metrics">
        <Metric label="Total members" value={members} detail={activeMembers + " active accounts"} />
        <Metric label="Live Scenes" value={scenes} detail="Active communities" />
        <Metric label="Squads" value={squads} detail="Created communities" />
        <Metric label="Reports" value={openReports} detail="Open, reviewing or appealed" />
        <Metric label="Moderation cases" value={openCases} detail="Awaiting resolution" />
        <Metric label="Transactions" value={payments} detail="All recorded payment attempts" />
        <Metric label="Staff assignments" value={staff} detail="Non-revoked assignments" />
      </section>
      <section className="admin-section">
        <div className="admin-section-heading"><div><p className="onboard-kicker">OPERATIONS</p><h2>Control rooms</h2></div></div>
        <div className="admin-action-list">
          <Link href="/admin/moderation"><span>⚑</span><div><strong>Trust & Safety</strong><small>Reports, cases, decisions and appeals</small></div><b>→</b></Link>
          <div className="admin-disabled"><span>♙</span><div><strong>Member management</strong><small>Account search, status, roles and access controls</small></div><em>Not enabled</em></div>
          <div className="admin-disabled"><span>◈</span><div><strong>Scenes & Squads</strong><small>Community review, ownership and visibility</small></div><em>Not enabled</em></div>
          <div className="admin-disabled"><span>₦</span><div><strong>Payments & memberships</strong><small>Transactions, plans, refunds and entitlements</small></div><em>Not enabled</em></div>
          <div className="admin-disabled"><span>⚙</span><div><strong>Platform configuration</strong><small>Feature flags, policies, banners and global settings</small></div><em>Not enabled</em></div>
          <div className="admin-disabled"><span>♧</span><div><strong>Staff & permissions</strong><small>Invite staff, assign roles and revoke access</small></div><em>Not enabled</em></div>
        </div>
      </section>
      <section className="admin-section">
        <div className="admin-section-heading"><div><p className="onboard-kicker">ACCOUNTABILITY</p><h2>Recent audit activity</h2></div></div>
        {recentAudit.length ? <div className="admin-audit-list">{recentAudit.map((item) => <article key={item.id}><div><strong>{item.action}</strong><small>{item.targetType}{item.targetId ? " · " + item.targetId : ""}</small></div><time dateTime={item.createdAt.toISOString()}>{item.createdAt.toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" })}</time></article>)}</div> : <p className="admin-empty">No audit events recorded yet. Privileged changes should create audit records before these controls go live.</p>}
      </section>
      <p className="admin-security-note">Protected server-side by the current staff assignment. This dashboard is an operational foundation, not yet the complete super-admin control suite. No destructive controls are exposed here until their workflows, safeguards and audit trails are implemented.</p>
    </main>
  );
}
