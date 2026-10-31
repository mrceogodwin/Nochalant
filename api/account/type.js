import { requireActiveUser } from "../_lib/neon-auth.js";

const ACCOUNT_TYPES = new Set(["fan","artist","creator","event_organizer","business","media"]);

export default async function handler(req, res) {
  if (!["GET", "POST"].includes(req.method)) {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const auth = await requireActiveUser(req);
  if (auth.error) return res.status(auth.error.status).json({ ok: false, error: auth.error.message });

  if (req.method === "GET") {
    try {
      const artistRows = auth.profile.account_type === "artist" ? await auth.sql`SELECT id, stage_name, slug, bio, avatar_url, verification_status FROM artist_profiles WHERE owner_user_id = ${auth.profile.id} LIMIT 1` : [];
      return res.status(200).json({ ok: true, profile: auth.profile, artistProfile: artistRows[0] || null });
    } catch (error) {
      console.error("Nochalant account profile read failed:", error?.message || error);
      return res.status(503).json({ ok: false, error: "Your profile is temporarily unavailable." });
    }
  }

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
      const existing = await auth.sql`SELECT id, stage_name, slug, verification_status FROM artist_profiles WHERE owner_user_id = ${auth.profile.id} LIMIT 1`;
      artistProfile = existing[0] || null;
      if (!artistProfile) {
        const baseSlug = String(rows[0].display_name || "artist").toLowerCase().normalize("NFKD").replace(/[\\u0300-\\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48) || "artist";
        const slug = baseSlug + "-" + crypto.randomUUID().slice(0, 8);
        const created = await auth.sql`INSERT INTO artist_profiles (owner_user_id, stage_name, slug, verification_status) VALUES (${auth.profile.id}, ${rows[0].display_name}, ${slug}, 'unverified') RETURNING id, stage_name, slug, verification_status`;
        artistProfile = created[0] || null;
      }
    }

    return res.status(200).json({ ok: true, profile: rows[0], artistProfile });
  } catch (error) {
    console.error("Nochalant account type update failed:", error?.message || error);
    return res.status(503).json({ ok: false, error: "Your account type could not be saved yet. Please try again." });
  }
}
