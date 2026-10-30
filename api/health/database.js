import { neon } from "@neondatabase/serverless";

const REQUIRED_TABLES = [
  "user_profiles",
  "submissions",
  "payments",
  "carousel_placements",
  "agenda_events",
  "editorial_audit_log",
  "artist_profiles",
  "music_releases",
  "music_tracks",
  "music_rights_records",
  "music_charts",
  "chart_periods",
  "chart_entries",
  "music_play_events",
  "promotion_campaigns",
  "payment_orders",
  "payment_webhook_events",
  "payment_refunds",
  "user_subscriptions",
  "community_posts",
  "community_comments",
  "community_reactions",
  "user_follows",
  "artist_follows",
  "community_reports",
  "user_notifications",
  "moderation_actions",
  "post_view_counts",
  "post_viewers",
  "community_profiles"
];

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const connectionString = process.env.DATABASE_URL_POOLED || process.env.DATABASE_URL;
  if (!connectionString) {
    return res.status(503).json({
      ok: false,
      database: "not_configured",
      message: "Set DATABASE_URL_POOLED or DATABASE_URL in Vercel server-side environment variables."
    });
  }

  try {
    const sql = neon(connectionString);
    const rows = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
        AND table_name = ANY(${REQUIRED_TABLES})
    `;
    const present = new Set(rows.map(row => row.table_name));
    const missing = REQUIRED_TABLES.filter(name => !present.has(name));
    return res.status(missing.length ? 503 : 200).json({
      ok: missing.length === 0,
      database: "connected",
      schema: missing.length === 0 ? "complete" : "incomplete",
      checked_tables: REQUIRED_TABLES.length,
      present_tables: REQUIRED_TABLES.length - missing.length,
      missing_tables: missing
    });
  } catch (error) {
    console.error("Database health check failed:", error?.message || error);
    return res.status(503).json({
      ok: false,
      database: "unavailable",
      message: "The database connection or schema check failed."
    });
  }
}
