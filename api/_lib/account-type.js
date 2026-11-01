import { randomUUID } from "node:crypto";
import { createMusicUploadUrl, verifyArtworkUpload, resolveMusicAssetUrl } from "./music-storage.js";
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
        profileDetails: details[0] ? { ...details[0], avatar_url: await resolveMusicAssetUrl(details[0].avatar_url) } : null,
        accountTypes: memberships,
        artistProfile: artistRows[0] || null
      });
    }

    if (req.body?.action === "create_profile_avatar_upload") {
      const contentType = String(req.body?.contentType || "").toLowerCase();
      const extension = { "image/jpeg":"jpg", "image/png":"png", "image/webp":"webp", "image/avif":"avif" }[contentType];
      const size = Number(req.body?.size);
      if (!extension || !Number.isSafeInteger(size) || size < 1 || size > 5 * 1024 * 1024) {
        return res.status(400).json({ ok: false, error: "Choose a JPEG, PNG, WebP or AVIF image under 5 MB." });
      }
      const objectKey = "members/" + auth.profile.id + "/avatar-" + randomUUID() + "." + extension;
      const signed = await createMusicUploadUrl(objectKey, contentType);
      return res.status(200).json({ ok: true, objectKey, ...signed });
    }

    if (req.body?.action === "save_profile") {
      const username = String(req.body?.username || "").trim().toLowerCase();
      const bio = String(req.body?.bio || "").trim();
      const website = String(req.body?.websiteUrl || "").trim();
      const location = String(req.body?.location || "").trim();
      const avatarObjectKey = String(req.body?.avatarObjectKey || "").trim();
      if (avatarObjectKey && (!avatarObjectKey.startsWith("members/" + auth.profile.id + "/avatar-") || avatarObjectKey.includes(".."))) {
        return res.status(400).json({ ok: false, error: "Invalid profile photo reference." });
      }
      if (avatarObjectKey) {
        const uploadedAvatar = await verifyArtworkUpload(avatarObjectKey);
        // Profile-photo uploads have a stricter 5 MB limit than general artwork.
        // Enforce it against the stored object, not only the client-supplied size.
        if (uploadedAvatar.size > 5 * 1024 * 1024) {
          return res.status(400).json({ ok: false, error: "Profile photos must be 5 MB or smaller." });
        }
      }
      if (username && !/^[a-z0-9_]{3,24}$/.test(username)) {
        return res.status(400).json({ ok: false, error: "Username must be 3–24 characters using letters, numbers or underscores." });
      }
      if (bio.length > 280 || location.length > 100) {
        return res.status(400).json({ ok: false, error: "Please shorten your bio or location." });
      }
      let websiteUrl = null;
      if (website) {
        try {
          const parsed = new URL(website);
          if (parsed.protocol !== "https:") throw new Error("https required");
          websiteUrl = parsed.toString();
        } catch {
          return res.status(400).json({ ok: false, error: "Enter a valid secure website address beginning with https://." });
        }
      }
      const saved = await auth.sql`INSERT INTO user_profile_details
        (user_profile_id, username, bio, website_url, location, avatar_url)
        VALUES (${auth.profile.id}, ${username || null}, ${bio}, ${websiteUrl}, ${location}, ${avatarObjectKey ? "neon-storage:" + avatarObjectKey : null})
        ON CONFLICT (user_profile_id) DO UPDATE SET
          username = EXCLUDED.username, bio = EXCLUDED.bio,
          website_url = EXCLUDED.website_url, location = EXCLUDED.location,
          avatar_url = COALESCE(EXCLUDED.avatar_url, user_profile_details.avatar_url),
          updated_at = now()
        RETURNING username, avatar_url, bio, website_url, location`;
      return res.status(200).json({ ok: true, profileDetails: saved[0] ? { ...saved[0], avatar_url: await resolveMusicAssetUrl(saved[0].avatar_url) } : null });
    }

    if (req.body?.action === "switch_primary") {
      const requestedType = String(req.body?.accountType || "");
      if (!ACCOUNT_TYPES.has(requestedType)) {
        return res.status(400).json({ ok: false, error: "Choose a valid workspace." });
      }
      const membership = await auth.sql`SELECT id FROM user_account_types
        WHERE user_profile_id = ${auth.profile.id}
          AND account_type = ${requestedType} AND status = 'active' LIMIT 1`;
      if (!membership.length) {
        return res.status(403).json({ ok: false, error: "That workspace is not active on your account yet." });
      }
      await auth.sql`UPDATE user_account_types SET is_primary = false, updated_at = now()
        WHERE user_profile_id = ${auth.profile.id} AND is_primary = true`;
      await auth.sql`UPDATE user_account_types SET is_primary = true, updated_at = now()
        WHERE user_profile_id = ${auth.profile.id} AND account_type = ${requestedType} AND status = 'active'`;
      await auth.sql`UPDATE user_profiles SET account_type = ${requestedType}, updated_at = now()
        WHERE id = ${auth.profile.id}`;
      const accountTypes = await auth.sql`SELECT account_type, status, is_primary, activated_at
        FROM user_account_types WHERE user_profile_id = ${auth.profile.id} AND status = 'active'
        ORDER BY is_primary DESC, activated_at ASC`;
      return res.status(200).json({
        ok: true,
        profile: { ...auth.profile, account_type: requestedType },
        accountTypes
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
          .normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48) || "artist";
        const slug = baseSlug + "-" + randomUUID().slice(0, 8);
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
    if (error?.code === "23505" || /unique constraint|duplicate key/i.test(String(error?.message || ""))) {
      return res.status(409).json({
        ok: false,
        error: "That username is already in use. Please choose another one."
      });
    }
    console.error("Nochalant account profile operation failed:", error?.message || error);
    return res.status(503).json({
      ok: false,
      error: "Account workspaces are not ready yet. The approved account migration must be applied before this feature can be used."
    });
  }
}
