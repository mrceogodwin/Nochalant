import { neon } from "@neondatabase/serverless";

const REQUIRED_TABLES = [
  "user_profiles",
  "submissions",
  "payments",
  "carousel_placements",
  "agenda_events",
  "editorial_audit_log",
  "artist_profiles",
  "artists",
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
  "community_profiles",
  "community_opinions",
  "opinion_reports",
  "podcast_shows",
  "podcast_seasons",
  "podcast_episodes",
  "podcast_clips",
  "hot_trash_polls",
  "hot_trash_votes",
  "artist_verification_payments",
  "user_account_types",
  "user_profile_details",
  "podcast_staff_accounts",
  "social_feature_settings",
  "social_stories",
  "social_story_views"
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
    const requiredColumns = [
      ["payment_refunds", "provider_refund_id"],
      ["payment_refunds", "refunded_amount_minor"],
      ["user_account_types", "is_primary"],
      ["user_profile_details", "avatar_url"],
      ["social_feature_settings", "enabled"],
      ["user_profiles", "account_type_locked_at"]
    ];
    const columnRows = await sql`
      SELECT table_name, column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND (table_name, column_name) IN (
          ('payment_refunds', 'provider_refund_id'),
          ('payment_refunds', 'refunded_amount_minor'),
          ('user_account_types', 'is_primary'),
          ('user_profile_details', 'avatar_url'),
          ('social_feature_settings', 'enabled'),
          ('user_profiles', 'account_type_locked_at')
        )
    `;
    const presentColumns = new Set(columnRows.map(row => row.table_name + "." + row.column_name));
    const missingColumns = requiredColumns
      .map(([table, column]) => table + "." + column)
      .filter(name => !presentColumns.has(name));
    const triggerRows = await sql`
      SELECT EXISTS (
        SELECT 1 FROM pg_trigger t
        JOIN pg_class c ON c.oid = t.tgrelid
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public'
          AND c.relname = 'user_profiles'
          AND t.tgname = 'user_profiles_account_type_immutable'
          AND NOT t.tgisinternal
      ) AS account_type_lock_trigger_present
    `;
    const missingTriggers = triggerRows[0]?.account_type_lock_trigger_present
      ? []
      : ['user_profiles.user_profiles_account_type_immutable'];
    const requiredIndexes = ['artist_profiles_owner_user_id_key'];
    const indexRows = await sql`
      SELECT indexname
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND indexname = ANY(${requiredIndexes})
    `;
    const presentIndexes = new Set(indexRows.map(row => row.indexname));
    const missingIndexes = requiredIndexes.filter(name => !presentIndexes.has(name));
    const complete = missing.length === 0 && missingColumns.length === 0
      && missingTriggers.length === 0 && missingIndexes.length === 0;
    return res.status(complete ? 200 : 503).json({
      ok: complete,
      database: "connected",
      schema: complete ? "complete" : "incomplete",
      checked_tables: REQUIRED_TABLES.length,
      present_tables: REQUIRED_TABLES.length - missing.length,
      missing_tables: missing,
      checked_columns: requiredColumns.length,
      missing_columns: missingColumns,
      checked_triggers: 1,
      missing_triggers: missingTriggers,
      checked_indexes: requiredIndexes.length,
      missing_indexes: missingIndexes
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
