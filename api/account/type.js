import { requireActiveUser } from "../_lib/neon-auth.js";

const ACCOUNT_TYPES = new Set(["fan","artist","creator","event_organizer","business","media"]);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const auth = await requireActiveUser(req);
  if (auth.error) return res.status(auth.error.status).json({ ok: false, error: auth.error.message });

  const accountType = String(req.body?.accountType || "");
  if (!ACCOUNT_TYPES.has(accountType)) {
    return res.status(400).json({ ok: false, error: "Choose a valid account type." });
  }

  try {
    const rows = await auth.sql`
      UPDATE user_profiles
      SET account_type = ${accountType}
      WHERE id = ${auth.profile.id}
      RETURNING id, display_name, email, account_type, role
    `;
    if (!rows.length) return res.status(404).json({ ok: false, error: "Account profile not found." });

    let artistProfile = null;
    if (accountType === "artist") {
      const existing = await auth.sql`
        SELECT id, stage_name, slug, verification_status
        FROM artist_profiles
        WHERE owner_user_id = ${auth.profile.id}
        LIMIT 1
      `;
      artistProfile = existing[0] || null;
    }

    return res.status(200).json({ ok: true, profile: rows[0], artistProfile });
  } catch (error) {
    console.error("Nochalant account type update failed:", error?.message || error);
    return res.status(503).json({ ok: false, error: "Your account type could not be saved yet. Please try again." });
  }
}
