import { requireActiveUser } from "../_lib/neon-auth.js";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  const auth = await requireActiveUser(req);
  if (auth.error) return res.status(auth.error.status).json({ ok: false, error: auth.error.message });
  if (auth.profile.role !== "super_admin") return res.status(403).json({ ok: false, error: "Only the Super Admin can change Social feature settings." });

  if (req.method === "GET") {
    try {
      const rows = await auth.sql`
        SELECT enabled, updated_at
        FROM social_feature_settings
        WHERE setting_key = 'video_posts_enabled'
        LIMIT 1
      `;
      return res.status(200).json({ ok: true, videoPostsEnabled: rows[0]?.enabled === true, updatedAt: rows[0]?.updated_at || null });
    } catch (error) {
      console.error("Nochalant Social settings unavailable:", error?.message || error);
      return res.status(503).json({ ok: false, code: "SOCIAL_SETTINGS_NOT_READY", error: "Social feature settings are not installed yet. Apply the pending Social settings migration first." });
    }
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }
  if (typeof req.body?.videoPostsEnabled !== "boolean") return res.status(400).json({ ok: false, error: "Choose whether video posting is enabled or disabled." });

  try {
    const rows = await auth.sql`
      UPDATE social_feature_settings
      SET enabled = ${req.body.videoPostsEnabled},
          updated_by = ${auth.profile.id},
          updated_at = now()
      WHERE setting_key = 'video_posts_enabled'
      RETURNING enabled, updated_at
    `;
    if (!rows.length) return res.status(503).json({ ok: false, code: "SOCIAL_SETTINGS_NOT_READY", error: "The Social settings migration has not been applied." });
    return res.status(200).json({ ok: true, videoPostsEnabled: rows[0].enabled, updatedAt: rows[0].updated_at });
  } catch (error) {
    console.error("Nochalant Social setting update failed:", error?.message || error);
    return res.status(503).json({ ok: false, error: "The video posting setting could not be saved." });
  }
}
