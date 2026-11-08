import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireModerator } from "@/lib/auth/guards";
import RevokeBadgeButton from "./revoke-button";

export const dynamic = "force-dynamic";

export default async function AdminAchievementsPage() {
  await requireModerator();
  const [catalogue, recent, activeAwards, revokedAwards] = await Promise.all([
    prisma.badgeCatalog.findMany({
      where: { active: true },
      orderBy: [{ rarity: "asc" }, { name: "asc" }],
      select: { id: true, name: true, description: true, rarity: true, criteria: true },
    }),
    prisma.userBadge.findMany({
      orderBy: { earnedAt: "desc" },
      take: 75,
      select: {
        id: true, earnedAt: true, revokedAt: true, revocationReason: true,
        user: { select: { username: true, displayName: true, email: true } },
        badge: { select: { name: true, rarity: true } },
      },
    }),
    prisma.userBadge.count({ where: { revokedAt: null } }),
    prisma.userBadge.count({ where: { revokedAt: { not: null } } }),
  ]);

  return (
    <main className="feed-shell admin-console">
      <header className="chat-header admin-header">
        <Link href="/admin">‹</Link>
        <div><strong>Achievements & badges</strong><small>Trust & Safety · Reward governance</small></div>
        <span className="admin-tag">RESTRICTED</span>
      </header>
      <section className="admin-welcome">
        <p className="onboard-kicker">COMMUNITY RECOGNITION</p>
        <h1>Reward the<br/><em>real ones.</em></h1>
        <p>Review the badge catalogue and recent awards. Revocations require a reason and are written to the immutable audit history.</p>
      </section>
      <section className="admin-metrics-grid">
        <article className="admin-metric"><span>Active awards</span><strong>{activeAwards.toLocaleString("en-NG")}</strong><small>Currently visible to members</small></article>
        <article className="admin-metric"><span>Revoked awards</span><strong>{revokedAwards.toLocaleString("en-NG")}</strong><small>Retained for audit history</small></article>
        <article className="admin-metric"><span>Badge definitions</span><strong>{catalogue.length}</strong><small>Active achievement rules</small></article>
      </section>
      <section className="admin-section">
        <div className="admin-section-heading"><div><p className="onboard-kicker">LIVE CATALOGUE</p><h2>Achievement rules</h2></div></div>
        <div className="admin-member-list">
          {catalogue.map((badge) => {
            const criteria = badge.criteria as { metric?: string; threshold?: number };
            return <article key={badge.id}>
              <div className="admin-member-avatar">✦</div>
              <div className="admin-member-info">
                <strong>{badge.name}</strong>
                <small>{badge.description}</small>
                <small>{badge.rarity.replaceAll("_", " ")} · {criteria.metric ?? "Manual"} · {criteria.threshold ?? "—"}</small>
              </div>
            </article>;
          })}
        </div>
      </section>
      <section className="admin-section">
        <div className="admin-section-heading"><div><p className="onboard-kicker">AWARD OVERSIGHT</p><h2>Recent member awards</h2></div></div>
        {recent.length ? <div className="admin-member-list">
          {recent.map((item) => <article key={item.id}>
            <div className="admin-member-avatar">✦</div>
            <div className="admin-member-info">
              <strong>{item.badge.name}</strong>
              <small>{item.user.displayName} · @{item.user.username}</small>
              <small>{item.user.email} · {item.earnedAt.toLocaleString("en-NG")}</small>
              {item.revokedAt ? <small className="text-rose-300">Revoked: {item.revocationReason ?? "No reason recorded"} · {item.revokedAt.toLocaleDateString("en-NG")}</small> : null}
            </div>
            <RevokeBadgeButton userBadgeId={item.id} revoked={Boolean(item.revokedAt)} />
          </article>)}
        </div> : <div className="empty-state">No badge awards have been recorded yet. Run the approved seed process and let members earn achievements through verified activity.</div>}
      </section>
      <p className="admin-security-note">Moderators can revoke earned badges but cannot grant themselves or other members XP. Every revocation records the staff member, reason, badge and target account.</p>
    </main>
  );
}
