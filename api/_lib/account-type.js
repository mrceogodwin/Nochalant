import { requireActiveUser } from "./neon-auth.js";

const ACCOUNT_TYPES = new Set(["fan","artist","creator","event_organizer","business","media"]);

export async function handleAccountType(req, res) {
  if (!["GET", "POST"].includes(req.method)) {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }
  const auth = await requireActiveUser(req);
  if (auth.error) return res.status(auth.error.status).json({ ok: false, error: auth.error.message });

  try {
    if (req.method === "GET") {
      const [memberships, details, artistRows] = await Promise.all([
        auth.sql`SELECT account_type, status, is_primary, activated_at
          FROM user_account_types
          WHERE user_profile_id = ${auth.profile.id} AND status = 'active'
          ORDER BY is_primary DESC, activated_at ASC`,
        auth.sql`SELECT username, avatar_url, bio, website_url, location
          FROM user_profile_details WHERE user_profile_id = ${auth.profile.id} LIMIT 1`,
        auth.profile.account_type === "artist"
          ? auth.sql`SELECT id, stage_name, slug, bio, avatar_url, verification_status
              FROM artist_profiles WHERE owner_user_id = ${auth.profile.id} LIMIT 1`
          : Promise.resolve([])
      ]);
      return res.status(200).json({
        ok: true,
        profile: auth.profile,
        profileDetails: details[0] || null,
        accountTypes: memberships,
        artistProfile: artistRows[0] || null
      });
    }

    const accountType = String(req.body?.accountType || "");
    if (!ACCOUNT_TYPES.has(accountType)) {
      return res.status(400).json({ ok: false, error: "Choose a valid account type." });
    }

    const existing = await auth.sql`SELECT account_type, status, is_primary
      FROM user_account_types WHERE user_profile_id = ${auth.profile.id}`;
    const alreadyActive = existing.some(item => item.account_type === accountType && item.status === "active");
    if (!alreadyActive) {
      const hasPrimary = existing.some(item => item.is_primary && item.status === "active");
      await auth.sql`INSERT INTO user_account_types
        (user_profile_id, account_type, status, is_primary)
        VALUES (${auth.profile.id}, ${accountType}, 'active', ${!hasPrimary})
        ON CONFLICT (user_profile_id, account_type) DO UPDATE
        SET status = 'active',
            is_primary = CASE WHEN NOT EXISTS (
              SELECT 1 FROM user_account_types
              WHERE user_profile_id = ${auth.profile.id}
                AND is_primary = true AND status = 'active'
            ) THEN true ELSE user_account_types.is_primary END,
            activated_at = COALESCE(user_account_types.activated_at, now()),
            updated_at = now()`;
    }

    // Keep the legacy account_type as the primary workspace for older feature
    // handlers. Adding a second workspace never overwrites the primary choice.
    const primary = await auth.sql`SELECT account_type FROM user_account_types
      WHERE user_profile_id = ${auth.profile.id} AND status = 'active' AND is_primary = true LIMIT 1`;
    const primaryType = primary[0]?.account_type || accountType;
    await auth.sql`UPDATE user_profiles SET account_type = ${primaryType}
      WHERE id = ${auth.profile.id}`;

    let artistProfile = null;
    if (accountType === "artist") {
      const existingArtist = await auth.sql`SELECT id, stage_name, slug, verification_status
        FROM artist_profiles WHERE owner_user_id = ${auth.profile.id} LIMIT 1`;
      artistProfile = existingArtist[0] || null;
      if (!artistProfile) {
        const baseSlug = String(auth.profile.display_name || "artist").toLowerCase()
          .normalize("NFKD").replace(/[\\u0300-\\u036f]/g, "")
          .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48) || "artist";
        const slug = baseSlug + "-" + crypto.randomUUID().slice(0, 8);
        const created = await auth.sql`INSERT INTO artist_profiles
          (owner_user_id, stage_name, slug, verification_status)
          VALUES (${auth.profile.id}, ${auth.profile.display_name}, ${slug}, 'unverified')
          RETURNING id, stage_name, slug, verification_status`;
        artistProfile = created[0] || null;
      }
    }

    const accountTypes = await auth.sql`SELECT account_type, status, is_primary, activated_at
      FROM user_account_types
      WHERE user_profile_id = ${auth.profile.id} AND status = 'active'
      ORDER BY is_primary DESC, activated_at ASC`;
    return res.status(200).json({
      ok: true,
      profile: { ...auth.profile, account_type: primaryType },
      accountTypes,
      artistProfile
    });
  } catch (error) {
    console.error("Nochalant account profile operation failed:", error?.message || error);
    return res.status(503).json({
      ok: false,
      error: "Account workspaces are not ready yet. The approved account migration must be applied before this feature can be used."
    });
  }
}
