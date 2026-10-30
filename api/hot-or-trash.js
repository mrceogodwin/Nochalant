import { neon } from "@neondatabase/serverless";
import { requireActiveUser } from "../_lib/neon-auth.js";

const slugPattern = /^[a-z0-9][a-z0-9-]{1,79}$/;

export default async function handler(req, res) {
  const connectionString = process.env.DATABASE_URL_POOLED || process.env.DATABASE_URL;
  if (!connectionString) return res.status(503).json({ ok: false, error: "Voting is temporarily unavailable." });

  if (req.method === "GET") {
    const slug = String(req.query?.slug || "homepage-fashion-feature");
    if (!slugPattern.test(slug)) return res.status(400).json({ ok: false, error: "Invalid poll." });
    try {
      const sql = neon(connectionString);
      const rows = await sql`
        SELECT p.id, p.slug, p.question, p.context, p.image_url, p.ends_at,
          COUNT(v.id)::int AS total_votes,
          COUNT(v.id) FILTER (WHERE v.choice = 'hot')::int AS hot_votes,
          COUNT(v.id) FILTER (WHERE v.choice = 'trash')::int AS trash_votes
        FROM hot_trash_polls p
        LEFT JOIN hot_trash_votes v ON v.poll_id = p.id
        WHERE p.slug = ${slug} AND p.status IN ('active','closed')
          AND p.starts_at <= now()
        GROUP BY p.id
        LIMIT 1
      `;
      if (!rows.length) return res.status(404).json({ ok: false, error: "This poll is not available." });
      const poll = rows[0];
      const total = Number(poll.total_votes) || 0;
      const hot = Number(poll.hot_votes) || 0;
      const trash = Number(poll.trash_votes) || 0;
      return res.status(200).json({ ok: true, poll: { ...poll, total_votes: total, hot_votes: hot, trash_votes: trash, hot_percent: total ? Math.round(hot * 100 / total) : 0, trash_percent: total ? Math.round(trash * 100 / total) : 0 } });
    } catch (error) {
      console.error("Nochalant Hot or Trash feed failed:", error?.message || error);
      return res.status(503).json({ ok: false, error: "Voting results are temporarily unavailable." });
    }
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ ok: false, error: "Method not allowed." });
  }
  const auth = await requireActiveUser(req);
  if (auth.error) return res.status(auth.error.status).json({ ok: false, error: auth.error.message });
  const slug = String(req.body?.slug || "homepage-fashion-feature");
  const choice = req.body?.choice;
  if (!slugPattern.test(slug) || !["hot", "trash"].includes(choice)) {
    return res.status(400).json({ ok: false, error: "Choose Pure fire or Off key." });
  }
  try {
    const rows = await auth.sql`
      INSERT INTO hot_trash_votes (poll_id, voter_id, choice)
      SELECT p.id, ${auth.profile.id}, ${choice}
      FROM hot_trash_polls p
      WHERE p.slug = ${slug} AND p.status = 'active'
        AND p.starts_at <= now() AND (p.ends_at IS NULL OR p.ends_at > now())
      ON CONFLICT (poll_id, voter_id) DO NOTHING
      RETURNING id, choice, created_at
    `;
    if (!rows.length) {
      const existing = await auth.sql`
        SELECT v.choice FROM hot_trash_votes v
        JOIN hot_trash_polls p ON p.id = v.poll_id
        WHERE p.slug = ${slug} AND v.voter_id = ${auth.profile.id}
        LIMIT 1
      `;
      if (existing.length) return res.status(409).json({ ok: false, error: "You have already voted in this poll.", choice: existing[0].choice });
      return res.status(404).json({ ok: false, error: "This poll is closed or unavailable." });
    }
    const counts = await auth.sql`
      SELECT COUNT(*)::int AS total_votes,
        COUNT(*) FILTER (WHERE choice = 'hot')::int AS hot_votes,
        COUNT(*) FILTER (WHERE choice = 'trash')::int AS trash_votes
      FROM hot_trash_votes WHERE poll_id = (
        SELECT id FROM hot_trash_polls WHERE slug = ${slug}
      )
    `;
    const total = Number(counts[0]?.total_votes) || 0;
    const hot = Number(counts[0]?.hot_votes) || 0;
    const trash = Number(counts[0]?.trash_votes) || 0;
    return res.status(201).json({ ok: true, vote: rows[0], results: { total_votes: total, hot_votes: hot, trash_votes: trash, hot_percent: total ? Math.round(hot * 100 / total) : 0, trash_percent: total ? Math.round(trash * 100 / total) : 0 } });
  } catch (error) {
    console.error("Nochalant Hot or Trash vote failed:", error?.message || error);
    return res.status(503).json({ ok: false, error: "Your vote could not be saved. Please try again." });
  }
}
