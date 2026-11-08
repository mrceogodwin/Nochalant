"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type MemberData = {
  username: string; displayName: string; clubId: string | null; bio: string | null;
  identity: { id: string; name: string; rarity: string } | null; xp: number;
  rank: { code: string; name: string; minXp: number } | null;
  nextRank: { name: string; minXp: number } | null; progress: number;
  scenesCount: number; squadsCount: number;
  badges: { id: string; name: string; description: string; rarity: string }[];
  membership: { name: string; code: string };
};

export default function MyClub() {
  const [member, setMember] = useState<MemberData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    fetch("/api/me/reputation", { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to load your Club ID.");
        return data.member as MemberData;
      })
      .then((data) => { if (active) setMember(data); })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : "Unable to load your Club ID.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return (
    <main className="feed-shell">
      <header className="screen-heading"><h1>My Club ID</h1><p>Your identity in the community.</p></header>
      {loading ? <div className="empty-state" role="status">Loading your Club ID…</div> :
        error ? <div className="empty-state" role="alert">{error}</div> :
        member ? <>
          <section className="member-card" aria-label="Your Nochalant Club membership card">
            <div className="member-brand">♛ <strong>Nochalant</strong><small>CLUB</small></div>
            <h2>{member.displayName}</h2><p>@{member.username}</p>
            <div className="member-role">♛ &nbsp; {member.rank?.name ?? "New Face"}<span>{member.identity?.name ?? "MEMBER"}</span></div>
            <div className="member-number"><span>CLUB ID<strong>{member.clubId ?? "Pending assignment"}</strong></span><b>18+ MEMBER</b></div>
          </section>
          <Link href="/my-club/edit" className="membership-row profile-edit-link"><span>✎</span><div><strong>Edit profile</strong><small>Update your Club identity and privacy</small></div><b>›</b></Link>
          <div className="stats-grid">
            <div><strong>{member.xp.toLocaleString()}</strong><small>Reputation XP</small></div>
            <div><strong>{member.scenesCount}</strong><small>Scenes</small></div>
            <div><strong>{member.squadsCount}</strong><small>Squads</small></div>
          </div>
          <section className="membership-row" aria-label="Rank progression">
            <div className="w-full">
              <div className="flex items-center justify-between gap-3">
                <strong>{member.rank?.name ?? "New Face"}</strong>
                <small className="text-white/50">{member.nextRank ? `${member.nextRank.minXp - member.xp} XP to ${member.nextRank.name}` : "Highest rank reached"}</small>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-[#ed2939]" style={{ width: `${member.progress}%` }} />
              </div>
            </div>
          </section>
          <Link href="/my-club/reputation" className="membership-row"><span>↗</span><div><strong>Reputation history</strong><small>See every XP award and moderation reversal</small></div><b>›</b></Link>
          <Link href="/leaderboard" className="membership-row"><span>♛</span><div><strong>Club leaderboard</strong><small>Discover the community's top contributors</small></div><b>›</b></Link>
          <div className="queue-heading"><h2>My Badges</h2><Link href="/my-club/badges">View collection</Link></div>
          {member.badges.length ? <div className="badge-row">
            {member.badges.map((badge) => <div key={badge.id} title={badge.description}><span>✦</span><small>{badge.name}</small></div>)}
          </div> : <p className="selection-hint">Your earned badges will appear here as you participate in the Club.</p>}
          <Link href="/my-club/membership" className="membership-row"><span>♛</span><div><strong>Membership</strong><small>{member.membership.name}</small></div><b>›</b></Link>
          <Link href="/my-club/icons" className="membership-row"><span>✦</span><div><strong>Identity collection</strong><small>{member.identity?.name ?? "Choose an unlocked identity"}</small></div><b>›</b></Link>
          <Link href="/safety" className="membership-row"><span>⌁</span><div><strong>Safety centre</strong><small>Reports, privacy and blocked members</small></div><b>›</b></Link>
        </> : null}
      <ClubNav />
    </main>
  );
}
function ClubNav() {
  return <nav className="bottom-nav">
    <Link href="/club">⌂<small>Home</small></Link><Link href="/discover">◉<small>Discover</small></Link>
    <Link className="create-button" href="/club/create">＋</Link><Link href="/chats">▢<small>Chats</small></Link>
    <Link className="active" href="/my-club">♙<small>My Club</small></Link>
  </nav>;
}
