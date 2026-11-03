import { neon } from "@neondatabase/serverless";

const initials = (name = "") => name.trim().split(/\\s+/).slice(0, 2).map(part => part[0] || "").join("").toUpperCase();

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }
  const connectionString = process.env.DATABASE_URL_POOLED || process.env.DATABASE_URL;
  if (!connectionString) return res.status(503).json({ ok: false, error: "Database connection is not configured" });
  try {
    const sql = neon(connectionString);
    const rows = await sql`
      SELECT username, display_name, avatar_url, is_demo
      FROM community_profiles
      WHERE is_public = true
      ORDER BY sort_order ASC, created_at DESC
      LIMIT 30
    `;
    return res.status(200).json({
      ok: true,
      profiles: rows.map(row => ({
        ...row,
        initials: initials(row.display_name),
        tone: "lime"
      }))
    });
  } catch (error) {
    console.error("Nochalant Faces query failed:", error?.message || error);
    return res.status(503).json({ ok: false, error: "Community profiles are not available yet" });
  }
}
