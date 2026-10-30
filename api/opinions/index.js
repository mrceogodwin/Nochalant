import { neon } from "@neondatabase/serverless";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }
  const connectionString = process.env.DATABASE_URL_POOLED || process.env.DATABASE_URL;
  if (!connectionString) {
    return res.status(503).json({ ok: false, error: "Opinions are not connected to the database yet." });
  }
  try {
    const sql = neon(connectionString);
    const rows = await sql`
      SELECT o.id, o.body, o.topic, o.published_at,
             p.display_name AS author_name
      FROM community_opinions o
      JOIN user_profiles p ON p.id = o.author_id
      WHERE o.status = 'published'
        AND p.account_status = 'active'
      ORDER BY o.featured DESC, o.published_at DESC NULLS LAST, o.created_at DESC
      LIMIT 30
    `;
    return res.status(200).json({ ok: true, opinions: rows });
  } catch (error) {
    console.error("Nochalant opinions feed failed:", error?.message || error);
    return res.status(503).json({ ok: false, error: "Opinions are temporarily unavailable." });
  }
}
