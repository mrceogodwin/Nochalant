import { requireActiveUser } from "../_lib/neon-auth.js";
import { neon } from "@neondatabase/serverless";
import { createMusicDownloadUrl } from "../_lib/music-storage.js";
import { handleAccountType } from "../_lib/account-type.js";
import { handleArtistStudio } from "../_lib/artist-studio.js";
import { handlePodcast } from "../_lib/podcast.js";
import { handlePromotions } from "../_lib/promotions.js";

async function proxyNeonAuth(req, res) {
  const upstreamBase = process.env.NEON_AUTH_BASE_URL;
  if (!upstreamBase) return res.status(503).json({ message: "Neon Auth proxy is not configured." });

  const requestUrl = new URL(req.url, "https://nochalant.vercel.app");
  const authPath = requestUrl.searchParams.get("authPath") || "";
  const segments = authPath.split("/").filter(Boolean);
  if (!segments.length || segments.some(part => !/^[a-zA-Z0-9._~-]+$/.test(part))) {
    return res.status(400).json({ message: "Invalid authentication route." });
  }

  const upstream = new URL(upstreamBase.replace(/\/$/, "") + "/" + segments.join("/"));
  requestUrl.searchParams.delete("authPath");
  upstream.search = requestUrl.search;

  const headers = new Headers();
  for (const name of ["accept", "content-type", "cookie", "user-agent", "authorization"]) {
    const value = req.headers[name];
    if (typeof value === "string") headers.set(name, value);
  }
  headers.set("origin", "https://nochalant.vercel.app");

  const init = { method: req.method, headers, redirect: "manual" };
  if (!["GET", "HEAD"].includes(req.method) && req.body !== undefined) {
    if (typeof req.body === "string") init.body = req.body;
    else {
      init.body = JSON.stringify(req.body);
      if (!headers.has("content-type")) headers.set("content-type", "application/json");
    }
  }

  try {
    const response = await fetch(upstream, init);
    res.status(response.status);
    response.headers.forEach((value, name) => {
      if (!["set-cookie", "content-encoding", "content-length", "transfer-encoding", "connection"].includes(name.toLowerCase())) res.setHeader(name, value);
    });
    const cookies = typeof response.headers.getSetCookie === "function"
      ? response.headers.getSetCookie()
      : (response.headers.get("set-cookie") ? [response.headers.get("set-cookie")] : []);
    for (const cookie of cookies) {
      const rewritten = cookie
        .replace(/;\s*Domain=[^;]+/ig, "")
        .replace(/;\s*Path=\/neondb\/auth(?:\/[^;]*)?/ig, "; Path=/api/auth")
        .replace(/;\s*SameSite=None/ig, "; SameSite=Lax");
      res.appendHeader("Set-Cookie", rewritten);
    }
    return res.send(Buffer.from(await response.arrayBuffer()));
  } catch (error) {
    console.error("Neon Auth proxy failed:", error?.message || error);
    return res.status(502).json({ message: "Authentication service is temporarily unavailable." });
  }
}


async function handleTrackDownload(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }
  const trackId = String(req.query?.trackId || "");
  if (!/^[0-9a-f-]{36}$/i.test(trackId)) {
    return res.status(400).json({ ok: false, error: "A valid track is required." });
  }
  const connectionString = process.env.DATABASE_URL_POOLED || process.env.DATABASE_URL;
  if (!connectionString) return res.status(503).json({ ok: false, error: "Downloads are temporarily unavailable." });
  try {
    const sql = neon(connectionString);
    const rows = await sql`
      SELECT mt.audio_object_key
      FROM music_tracks mt
      JOIN music_releases mr ON mr.id = mt.release_id AND mr.status = 'published'
      JOIN artist_profiles ap ON ap.id = mt.artist_id AND ap.verification_status = 'verified'
      WHERE mt.id = ${trackId} AND mt.status = 'published'
      LIMIT 1
    `;
    if (!rows.length) return res.status(404).json({ ok: false, error: "This track is not available for download." });
    let audioUrl = null;
    const storedAudio = String(rows[0].audio_object_key || "");
    if (storedAudio.startsWith("neon-storage:")) {
      audioUrl = await createMusicDownloadUrl(storedAudio.slice("neon-storage:".length), 300);
    } else {
      try {
        const parsed = new URL(storedAudio);
        audioUrl = parsed.protocol === "https:" ? parsed.toString() : null;
      } catch { audioUrl = null; }
    }
    if (!audioUrl) return res.status(404).json({ ok: false, error: "The audio file has not been connected yet." });
    await sql`UPDATE music_tracks SET download_count = download_count + 1 WHERE id = ${trackId}`;
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Referrer-Policy", "no-referrer");
    return res.redirect(302, audioUrl);
  } catch (error) {
    console.error("Nochalant track download failed:", error?.message || error);
    return res.status(503).json({ ok: false, error: "This download could not be completed." });
  }
}



async function handleSocialNetwork(req, res) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("Vary", "Authorization");
  const auth = await requireActiveUser(req);
  if (auth.error) return res.status(auth.error.status).json({ ok: false, error: auth.error.message });
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  try {
    if (req.method === "GET") {
      if (req.query?.stories === "1") {
        const stories = await auth.sql`
          SELECT s.id, s.author_id, s.body, s.visibility, s.created_at, s.expires_at,
            u.display_name AS author_name, u.account_type,
            d.username, d.avatar_url,
            (SELECT COUNT(*)::int FROM social_story_views v WHERE v.story_id = s.id) AS view_count,
            EXISTS (SELECT 1 FROM social_story_views v WHERE v.story_id = s.id AND v.viewer_id = ${auth.profile.id}) AS viewer_seen
          FROM social_stories s
          JOIN user_profiles u ON u.id = s.author_id AND u.account_status = 'active'
          LEFT JOIN user_profile_details d ON d.user_profile_id = u.id
          WHERE s.status = 'published' AND s.expires_at > now()
            AND (s.author_id = ${auth.profile.id} OR s.visibility = 'public'
              OR EXISTS (SELECT 1 FROM user_follows f WHERE f.follower_id = ${auth.profile.id} AND f.followed_user_id = s.author_id))
          ORDER BY s.created_at DESC
          LIMIT 100
        `;
        return res.status(200).json({ ok: true, stories });
      }
      if (req.query?.member) {
        const memberId = String(req.query.member);
        if (!uuidPattern.test(memberId)) return res.status(400).json({ ok: false, error: "Invalid member profile." });
        const members = await auth.sql\`
          SELECT u.id, u.display_name, u.account_type, d.username, d.avatar_url,
            COALESCE(d.bio, '') AS bio, d.website_url, d.location,
            (SELECT COUNT(*)::int FROM user_follows f WHERE f.followed_user_id = u.id) AS follower_count,
            (SELECT COUNT(*)::int FROM user_follows f WHERE f.follower_id = u.id) AS following_count,
            EXISTS (SELECT 1 FROM user_follows f WHERE f.follower_id = \${auth.profile.id} AND f.followed_user_id = u.id) AS viewer_follows
          FROM user_profiles u LEFT JOIN user_profile_details d ON d.user_profile_id = u.id
          WHERE u.id = \${memberId} AND u.account_status = 'active'
          LIMIT 1
        \`;
        if (!members.length) return res.status(404).json({ ok: false, error: "Member profile not found." });
        const memberPosts = await auth.sql\`
          SELECT p.id, p.body, p.created_at,
            (SELECT COUNT(*)::int FROM community_reactions r WHERE r.post_id = p.id AND r.reaction = 'like') AS like_count,
            (SELECT COUNT(*)::int FROM community_comments c WHERE c.post_id = p.id AND c.status = 'published') AS comment_count
          FROM community_posts p
          WHERE p.author_id = \${memberId} AND p.status = 'published'
            AND (p.visibility = 'public' OR \${auth.profile.id} = \${memberId}
              OR EXISTS (SELECT 1 FROM user_follows f WHERE f.follower_id = \${auth.profile.id} AND f.followed_user_id = p.author_id))
          ORDER BY p.created_at DESC LIMIT 20
        \`;
        return res.status(200).json({ ok: true, profile: members[0], posts: memberPosts });
      }
      if (req.query?.profile === "1") {
        const rows = await auth.sql`
          SELECT u.id, u.display_name, u.email, u.account_type, d.username, d.avatar_url,
            COALESCE(d.bio, '') AS bio, d.website_url, d.location,
            (SELECT COUNT(*)::int FROM user_follows f WHERE f.followed_user_id = u.id) AS follower_count,
            (SELECT COUNT(*)::int FROM user_follows f WHERE f.follower_id = u.id) AS following_count
          FROM user_profiles u LEFT JOIN user_profile_details d ON d.user_profile_id = u.id
          WHERE u.id = ${auth.profile.id} LIMIT 1
        `;
        return res.status(200).json({ ok: true, profile: rows[0] || null });
      }
      if (req.query?.notifications === "1") {
        const notifications = await auth.sql`
          SELECT id, notification_type, title, body, target_path, read_at, created_at
          FROM user_notifications
          WHERE user_id = ${auth.profile.id}
          ORDER BY created_at DESC LIMIT 50
        `;
        return res.status(200).json({ ok: true, notifications });
      }
      const commentsFor = String(req.query?.commentsFor || "");
      if (commentsFor) {
        if (!uuidPattern.test(commentsFor)) return res.status(400).json({ ok: false, error: "Invalid post." });
        const accessible = await auth.sql`
          SELECT p.id FROM community_posts p
          WHERE p.id = ${commentsFor} AND p.status = 'published'
            AND (p.visibility = 'public' OR p.author_id = ${auth.profile.id}
              OR EXISTS (SELECT 1 FROM user_follows f WHERE f.follower_id = ${auth.profile.id} AND f.followed_user_id = p.author_id))
          LIMIT 1
        `;
        if (!accessible.length) return res.status(404).json({ ok: false, error: "Post not found." });
        const comments = await auth.sql`
          SELECT c.id, c.body, c.created_at, u.id AS author_id, u.display_name AS author_name, u.account_type, d.avatar_url
          FROM community_comments c JOIN user_profiles u ON u.id = c.author_id
          LEFT JOIN user_profile_details d ON d.user_profile_id = u.id
          WHERE c.post_id = ${commentsFor} AND c.status = 'published' AND u.account_status = 'active'
          ORDER BY c.created_at ASC LIMIT 100
        `;
        return res.status(200).json({ ok: true, comments });
      }
      const feed = req.query?.feed === "following" ? "following" : "for-you";
      const posts = await auth.sql`
        SELECT p.id, p.author_id, p.body, p.visibility, p.created_at,
          u.display_name AS author_name, u.account_type, d.avatar_url, d.username,
          (SELECT COUNT(*)::int FROM community_reactions r WHERE r.post_id = p.id AND r.reaction = 'like') AS like_count,
          (SELECT COUNT(*)::int FROM community_comments c WHERE c.post_id = p.id AND c.status = 'published') AS comment_count,
          EXISTS (SELECT 1 FROM community_reactions r WHERE r.post_id = p.id AND r.user_id = ${auth.profile.id} AND r.reaction = 'like') AS viewer_liked,
          (p.author_id <> ${auth.profile.id} AND EXISTS (
            SELECT 1 FROM user_follows f WHERE f.follower_id = ${auth.profile.id} AND f.followed_user_id = p.author_id
          )) AS viewer_follows_author
        FROM community_posts p JOIN user_profiles u ON u.id = p.author_id
        LEFT JOIN user_profile_details d ON d.user_profile_id = u.id
        WHERE p.status = 'published' AND u.account_status = 'active'
          AND (p.author_id = ${auth.profile.id} OR p.visibility = 'public'
            OR EXISTS (SELECT 1 FROM user_follows f WHERE f.follower_id = ${auth.profile.id} AND f.followed_user_id = p.author_id))
          AND (${feed} <> 'following' OR p.author_id = ${auth.profile.id}
            OR EXISTS (SELECT 1 FROM user_follows f WHERE f.follower_id = ${auth.profile.id} AND f.followed_user_id = p.author_id))
        ORDER BY p.created_at DESC LIMIT 40
      `;
      const suggestedMembers = await auth.sql`
        SELECT u.id, u.display_name, u.account_type, d.avatar_url, d.username
        FROM user_profiles u
        LEFT JOIN user_profile_details d ON d.user_profile_id = u.id
        WHERE u.id <> ${auth.profile.id} AND u.account_status = 'active'
          AND NOT EXISTS (SELECT 1 FROM user_follows f WHERE f.follower_id = ${auth.profile.id} AND f.followed_user_id = u.id)
        ORDER BY u.created_at DESC LIMIT 8
      `;
      return res.status(200).json({ ok: true, feed, viewerProfileId: auth.profile.id, posts, suggestedMembers });
    }
    if (req.method !== "POST") {
      res.setHeader("Allow", "GET, POST");
      return res.status(405).json({ ok: false, error: "Method not allowed." });
    }
    const action = String(req.body?.action || "");
    if (action === "create_story") {
      const body = typeof req.body?.body === "string" ? req.body.body.trim() : "";
      const visibility = req.body?.visibility === "followers" ? "followers" : "public";
      if (!body || body.length > 500) return res.status(400).json({ ok: false, error: "Stories must contain 1–500 characters." });
      const rows = await auth.sql`
        INSERT INTO social_stories (author_id, body, visibility, expires_at)
        VALUES (${auth.profile.id}, ${body}, ${visibility}, now() + interval '24 hours')
        RETURNING id, author_id, body, visibility, created_at, expires_at
      `;
      return res.status(201).json({ ok: true, story: { ...rows[0], author_name: auth.profile.display_name, account_type: auth.profile.account_type, view_count: 0, viewer_seen: true } });
    }
    if (action === "view_story") {
      const storyId = String(req.body?.storyId || "");
      if (!uuidPattern.test(storyId)) return res.status(400).json({ ok: false, error: "Invalid story." });
      const rows = await auth.sql`
        INSERT INTO social_story_views (story_id, viewer_id)
        SELECT s.id, ${auth.profile.id} FROM social_stories s
        WHERE s.id = ${storyId} AND s.status = 'published' AND s.expires_at > now()
          AND (s.author_id = ${auth.profile.id} OR s.visibility = 'public'
            OR EXISTS (SELECT 1 FROM user_follows f WHERE f.follower_id = ${auth.profile.id} AND f.followed_user_id = s.author_id))
        ON CONFLICT (story_id, viewer_id) DO NOTHING
        RETURNING story_id
      `;
      if (!rows.length) {
        const exists = await auth.sql`
          SELECT id FROM social_stories
          WHERE id = ${storyId} AND status = 'published' AND expires_at > now()
            AND (author_id = ${auth.profile.id} OR visibility = 'public'
              OR EXISTS (SELECT 1 FROM user_follows f WHERE f.follower_id = ${auth.profile.id} AND f.followed_user_id = author_id))
          LIMIT 1
        `;
        if (!exists.length) return res.status(404).json({ ok: false, error: "Story not found or expired." });
      }
      return res.status(200).json({ ok: true, viewed: true });
    }
    if (action === "update_profile") {
      const displayName = typeof req.body?.displayName === "string" ? req.body.displayName.trim() : "";
      const username = typeof req.body?.username === "string" ? req.body.username.trim().toLowerCase() : "";
      const bio = typeof req.body?.bio === "string" ? req.body.bio.trim() : "";
      const websiteUrl = typeof req.body?.websiteUrl === "string" ? req.body.websiteUrl.trim() : "";
      const location = typeof req.body?.location === "string" ? req.body.location.trim() : "";
      const avatarUrl = typeof req.body?.avatarUrl === "string" ? req.body.avatarUrl.trim() : "";
      if (displayName.length < 2 || displayName.length > 80) return res.status(400).json({ ok: false, error: "Display name must be 2–80 characters." });
      if (!/^[a-z0-9_]{3,24}$/.test(username)) return res.status(400).json({ ok: false, error: "Username must be 3–24 characters using letters, numbers or underscores." });
      if (bio.length > 280 || location.length > 100) return res.status(400).json({ ok: false, error: "Bio must be 280 characters or fewer and location 100 characters or fewer." });
      const safeUrl = (value) => {
        if (!value) return null;
        try { const parsed = new URL(value); return parsed.protocol === "https:" ? parsed.toString() : null; } catch { return null; }
      };
      const safeWebsite = safeUrl(websiteUrl);
      const safeAvatar = safeUrl(avatarUrl);
      if ((websiteUrl && !safeWebsite) || (avatarUrl && !safeAvatar)) return res.status(400).json({ ok: false, error: "Website and avatar links must use HTTPS." });
      try {
        await auth.sql`
          INSERT INTO user_profile_details (user_profile_id, username, avatar_url, bio, website_url, location)
          VALUES (${auth.profile.id}, ${username}, ${safeAvatar}, ${bio}, ${safeWebsite}, ${location || null})
          ON CONFLICT (user_profile_id) DO UPDATE SET
            username = EXCLUDED.username, avatar_url = EXCLUDED.avatar_url, bio = EXCLUDED.bio,
            website_url = EXCLUDED.website_url, location = EXCLUDED.location, updated_at = now()
        `;
      } catch (error) {
        if (error?.code === "23505") return res.status(409).json({ ok: false, error: "That username is already taken." });
        throw error;
      }
      const updated = await auth.sql`
        UPDATE user_profiles SET display_name = ${displayName}
        WHERE id = ${auth.profile.id}
        RETURNING id, display_name, account_type
      `;
      return res.status(200).json({ ok: true, profile: { ...updated[0], username, avatar_url: safeAvatar, bio, website_url: safeWebsite, location: location || null } });
    }
    if (action === "mark_notification_read") {
      const notificationId = String(req.body?.notificationId || "");
      if (!uuidPattern.test(notificationId)) return res.status(400).json({ ok: false, error: "Invalid notification." });
      const rows = await auth.sql`
        UPDATE user_notifications SET read_at = COALESCE(read_at, now())
        WHERE id = ${notificationId} AND user_id = ${auth.profile.id}
        RETURNING id, read_at
      `;
      if (!rows.length) return res.status(404).json({ ok: false, error: "Notification not found." });
      return res.status(200).json({ ok: true, notification: rows[0] });
    }
    if (action === "create_post") {
      const body = typeof req.body?.body === "string" ? req.body.body.trim() : "";
      const visibility = req.body?.visibility === "followers" ? "followers" : "public";
      if (!body || body.length > 10000) return res.status(400).json({ ok: false, error: "Write a post of up to 10,000 characters." });
      const rows = await auth.sql`
        INSERT INTO community_posts (author_id, body, visibility, status)
        VALUES (${auth.profile.id}, ${body}, ${visibility}, 'published')
        RETURNING id, author_id, body, visibility, created_at
      `;
      return res.status(201).json({ ok: true, post: { ...rows[0], author_name: auth.profile.display_name, account_type: auth.profile.account_type, like_count: 0, comment_count: 0, viewer_liked: false, viewer_follows_author: false } });
    }
    if (action === "comment") {
      const postId = String(req.body?.postId || "");
      const body = typeof req.body?.body === "string" ? req.body.body.trim() : "";
      if (!uuidPattern.test(postId) || !body || body.length > 4000) return res.status(400).json({ ok: false, error: "A valid post and comment of up to 4,000 characters are required." });
      const target = await auth.sql`
        SELECT p.author_id FROM community_posts p
        WHERE p.id = ${postId} AND p.status = 'published'
          AND (p.visibility = 'public' OR p.author_id = ${auth.profile.id}
            OR EXISTS (SELECT 1 FROM user_follows f WHERE f.follower_id = ${auth.profile.id} AND f.followed_user_id = p.author_id))
        LIMIT 1
      `;
      if (!target.length) return res.status(404).json({ ok: false, error: "Post not found." });
      const rows = await auth.sql`
        INSERT INTO community_comments (post_id, author_id, body, status)
        VALUES (${postId}, ${auth.profile.id}, ${body}, 'published')
        RETURNING id, post_id, body, created_at
      `;
      if (target[0].author_id !== auth.profile.id) {
        await auth.sql`
          INSERT INTO user_notifications (user_id, notification_type, title, body, target_path)
          VALUES (${target[0].author_id}, 'comment', 'New comment', ${auth.profile.display_name + " commented on your post."}, ${"/social?post=" + postId})
        `;
      }
      return res.status(201).json({ ok: true, comment: { ...rows[0], author_id: auth.profile.id, author_name: auth.profile.display_name, account_type: auth.profile.account_type } });
    }
    if (action === "toggle_like") {
      const postId = String(req.body?.postId || "");
      if (!uuidPattern.test(postId)) return res.status(400).json({ ok: false, error: "Invalid post." });
      const target = await auth.sql`
        SELECT p.author_id FROM community_posts p
        WHERE p.id = ${postId} AND p.status = 'published'
          AND (p.visibility = 'public' OR p.author_id = ${auth.profile.id}
            OR EXISTS (SELECT 1 FROM user_follows f WHERE f.follower_id = ${auth.profile.id} AND f.followed_user_id = p.author_id))
        LIMIT 1
      `;
      if (!target.length) return res.status(404).json({ ok: false, error: "Post not found." });
      const inserted = await auth.sql`
        INSERT INTO community_reactions (user_id, post_id, reaction)
        VALUES (${auth.profile.id}, ${postId}, 'like')
        ON CONFLICT (user_id, post_id, reaction) WHERE post_id IS NOT NULL DO NOTHING
        RETURNING id
      `;
      const liked = inserted.length > 0;
      if (!liked) await auth.sql`DELETE FROM community_reactions WHERE user_id = ${auth.profile.id} AND post_id = ${postId} AND reaction = 'like'`;
      return res.status(200).json({ ok: true, liked });
    }
    if (action === "follow" || action === "unfollow") {
      const targetUserId = String(req.body?.targetUserId || "");
      if (!uuidPattern.test(targetUserId) || targetUserId === auth.profile.id) return res.status(400).json({ ok: false, error: "Choose another valid member to follow." });
      const target = await auth.sql`SELECT id FROM user_profiles WHERE id = ${targetUserId} AND account_status = 'active' LIMIT 1`;
      if (!target.length) return res.status(404).json({ ok: false, error: "Member not found." });
      if (action === "follow") {
        const inserted = await auth.sql`
          INSERT INTO user_follows (follower_id, followed_user_id)
          VALUES (${auth.profile.id}, ${targetUserId})
          ON CONFLICT (follower_id, followed_user_id) DO NOTHING RETURNING follower_id
        `;
        if (inserted.length) {
          await auth.sql`
            INSERT INTO user_notifications (user_id, notification_type, title, body, target_path)
            VALUES (${targetUserId}, 'follow', 'New follower', ${auth.profile.display_name + " started following you."}, '/social')
          `;
        }
        return res.status(200).json({ ok: true, following: true });
      }
      await auth.sql`DELETE FROM user_follows WHERE follower_id = ${auth.profile.id} AND followed_user_id = ${targetUserId}`;
      return res.status(200).json({ ok: true, following: false });
    }
    return res.status(400).json({ ok: false, error: "Unsupported social action." });
  } catch (error) {
    console.error("Nochalant Social request failed:", error?.message || error);
    return res.status(503).json({ ok: false, error: "Nochalant Social is temporarily unavailable." });
  }
}

async function handleSocialFeed(req, res) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("Vary", "Authorization");
  if (req.method !== "GET") { res.setHeader("Allow", "GET"); return res.status(405).json({ ok: false, error: "Method not allowed" }); }
  const auth = await requireActiveUser(req);
  if (auth.error) return res.status(auth.error.status).json({ ok: false, error: auth.error.message });
  try {
    const posts = await auth.sql`
      SELECT o.id, o.body, o.topic, o.published_at, p.display_name AS author_name
      FROM community_opinions o JOIN user_profiles p ON p.id = o.author_id
      WHERE o.status = 'published' AND p.account_status = 'active'
      ORDER BY o.featured DESC, o.published_at DESC NULLS LAST, o.created_at DESC LIMIT 30
    `;
    return res.status(200).json({ ok: true, posts });
  } catch (error) {
    console.error("Nochalant member social feed failed:", error?.message || error);
    return res.status(503).json({ ok: false, error: "The social feed is temporarily unavailable." });
  }
}

async function handleSocialSettings(req, res) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  const auth = await requireActiveUser(req);
  if (auth.error) return res.status(auth.error.status).json({ ok: false, error: auth.error.message });
  if (auth.profile.role !== "super_admin") return res.status(403).json({ ok: false, error: "Only the Super Admin can change Social feature settings." });
  if (req.method === "GET") {
    try {
      const rows = await auth.sql`SELECT enabled, updated_at FROM social_feature_settings WHERE setting_key = 'video_posts_enabled' LIMIT 1`;
      return res.status(200).json({ ok: true, videoPostsEnabled: rows[0]?.enabled === true, updatedAt: rows[0]?.updated_at || null });
    } catch (error) {
      console.error("Nochalant Social settings unavailable:", error?.message || error);
      return res.status(503).json({ ok: false, code: "SOCIAL_SETTINGS_NOT_READY", error: "Social feature settings are not installed yet. Apply the pending Social settings migration first." });
    }
  }
  if (req.method !== "POST") { res.setHeader("Allow", "GET, POST"); return res.status(405).json({ ok: false, error: "Method not allowed" }); }
  if (typeof req.body?.videoPostsEnabled !== "boolean") return res.status(400).json({ ok: false, error: "Choose whether video posting is enabled or disabled." });
  if (req.body.videoPostsEnabled === true) return res.status(409).json({ ok: false, code: "VIDEO_PIPELINE_NOT_READY", error: "Video posting cannot be enabled yet. The secure upload, malware-scanning, quarantine and moderation pipeline is not deployed." });
  try {
    const rows = await auth.sql`
      UPDATE social_feature_settings SET enabled = ${req.body.videoPostsEnabled}, updated_by = ${auth.profile.id}, updated_at = now()
      WHERE setting_key = 'video_posts_enabled' RETURNING enabled, updated_at
    `;
    if (!rows.length) return res.status(503).json({ ok: false, code: "SOCIAL_SETTINGS_NOT_READY", error: "The Social settings migration has not been applied." });
    return res.status(200).json({ ok: true, videoPostsEnabled: rows[0].enabled, updatedAt: rows[0].updated_at });
  } catch (error) {
    console.error("Nochalant Social setting update failed:", error?.message || error);
    return res.status(503).json({ ok: false, error: "The video posting setting could not be saved." });
  }
}

const opinionStatuses = { approve: "published", reject: "removed", hide: "hidden", restore: "published" };
const accountActions = ["suspend","unsuspend","ban","unban"];

export default async function handler(req, res) {
  if (req.query?.socialRoute) return handleSocialNetwork(req, res);
  if (req.query?.socialFeedRoute) return handleSocialFeed(req, res);
  if (req.query?.socialSettingsRoute) return handleSocialSettings(req, res);
  if (req.query?.downloadRoute) return handleTrackDownload(req, res);
  if (req.query?.authPath) return proxyNeonAuth(req, res);
  if (req.query?.accountTypeRoute) return handleAccountType(req, res);
  if (req.query?.artistStudioRoute) return handleArtistStudio(req, res);
  if (req.query?.podcastRoute) return handlePodcast(req, res);
  if (req.query?.promotionsRoute) return handlePromotions(req, res);
  const auth = await requireActiveUser(req);
  if (auth.error) return res.status(auth.error.status).json({ ok: false, error: auth.error.message });
  if (auth.profile.role !== "super_admin") return res.status(403).json({ ok: false, error: "Only the Super Admin can moderate content." });
  if (req.method === "GET") {
    try {
      const [opinions, reports, users] = await Promise.all([
        auth.sql`SELECT o.id, o.body, o.topic, o.status, o.created_at, p.display_name AS author_name FROM community_opinions o JOIN user_profiles p ON p.id = o.author_id WHERE o.status IN ('pending','hidden') ORDER BY o.created_at ASC LIMIT 100`,
        auth.sql`SELECT r.id, r.opinion_id, r.reason, r.details, r.status, r.created_at, o.body AS opinion_body, p.display_name AS reporter_name FROM opinion_reports r JOIN community_opinions o ON o.id = r.opinion_id JOIN user_profiles p ON p.id = r.reporter_id WHERE r.status IN ('open','reviewing') ORDER BY r.created_at ASC LIMIT 100`,
        auth.sql`SELECT id, display_name, email, role, account_status, suspended_until FROM user_profiles WHERE role <> 'super_admin' ORDER BY created_at DESC LIMIT 100`
      ]);
      // Artist management is additive: a missing/unapplied artist migration must not
      // take down the existing moderation and account-management dashboard.
      let artists = [];
      let artistsAvailable = true;
      try {
        artists = await auth.sql`SELECT id, name, genre, image_url, profile_url, is_active, sort_order FROM artists ORDER BY sort_order ASC, created_at DESC LIMIT 200`;
      } catch (artistError) {
        artistsAvailable = false;
        console.error("Nochalant artist table is not ready:", artistError?.message || artistError);
      }
      let artistApplications = [];
      let artistApplicationsAvailable = true;
      try {
        artistApplications = await auth.sql`
          SELECT ap.id, ap.stage_name, ap.slug, ap.bio, ap.avatar_url, ap.city, ap.country_code,
                 ap.verification_status, ap.created_at, up.display_name, up.email
          FROM artist_profiles ap
          JOIN user_profiles up ON up.id = ap.owner_user_id
          WHERE ap.verification_status IN ('unverified','pending')
          ORDER BY ap.created_at ASC LIMIT 100
        `;
      } catch (applicationError) {
        artistApplicationsAvailable = false;
        console.error("Nochalant artist verification queue is not ready:", applicationError?.message || applicationError);
      }
      let musicReleases = [];
      let musicAvailable = true;
      try {
        musicReleases = await auth.sql`
          SELECT mr.id, mr.title, mr.release_type, mr.cover_art_url, mr.release_date, mr.genre, mr.status,
                 mr.created_at, ap.stage_name AS artist_name, ap.verification_status,
                 COUNT(mt.id)::int AS track_count,
                 COUNT(mt.id) FILTER (WHERE mt.status = 'pending')::int AS pending_tracks
          FROM music_releases mr
          JOIN artist_profiles ap ON ap.id = mr.artist_id
          LEFT JOIN music_tracks mt ON mt.release_id = mr.id
          WHERE mr.status IN ('submitted','under_review')
          GROUP BY mr.id, ap.id
          ORDER BY mr.created_at ASC LIMIT 100
        `;
      } catch (musicError) {
        musicAvailable = false;
        console.error("Nochalant music review queue is not ready:", musicError?.message || musicError);
      }
      return res.status(200).json({ ok: true, opinions, reports, users, artists, artistsAvailable, artistApplications, artistApplicationsAvailable, musicReleases, musicAvailable });
    } catch (error) {
      console.error("Nochalant moderation queue failed:", error?.message || error);
      return res.status(503).json({ ok: false, error: "Moderation queue is temporarily unavailable." });
    }
  }
  if (req.method !== "POST") { res.setHeader("Allow", "GET, POST"); return res.status(405).json({ ok: false, error: "Method not allowed" }); }
  const action = String(req.body?.action || "");
  const opinionId = String(req.body?.opinionId || "");
  const reportId = String(req.body?.reportId || "");
  const targetUserId = String(req.body?.targetUserId || "");
  const reason = typeof req.body?.reason === "string" ? req.body.reason.trim().slice(0,500) : "";
  try {
    if (action === "setup_artists") {
      await auth.sql`CREATE TABLE IF NOT EXISTS artists (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name text NOT NULL CHECK (char_length(trim(name)) BETWEEN 1 AND 100),
        genre text,
        image_url text,
        profile_url text,
        is_active boolean NOT NULL DEFAULT true,
        sort_order integer NOT NULL DEFAULT 0,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )`;
      await auth.sql`CREATE INDEX IF NOT EXISTS artists_homepage_idx ON artists(is_active, sort_order ASC, name ASC)`;
      await auth.sql`DROP TRIGGER IF EXISTS artists_updated_at ON artists`;
      await auth.sql`CREATE TRIGGER artists_updated_at BEFORE UPDATE ON artists FOR EACH ROW EXECUTE FUNCTION set_updated_at()`;
      return res.status(200).json({ ok:true, message:"Artist database is ready." });
    }
    if (["create_artist", "update_artist", "deactivate_artist"].includes(action)) {
      const clean = (value, max) => typeof value === "string" ? value.trim().slice(0, max) : "";
      const safeUrl = value => {
        const raw = clean(value, 1000);
        if (!raw) return null;
        try { const url = new URL(raw); return url.protocol === "https:" ? url.toString() : null; }
        catch { return null; }
      };
      const id = String(req.body?.artistId || "");
      if (action === "deactivate_artist") {
        if (!/^[0-9a-f-]{36}$/i.test(id)) return res.status(400).json({ ok:false,error:"Invalid artist." });
        const rows = await auth.sql`UPDATE artists SET is_active = false WHERE id = ${id} RETURNING id`;
        if (!rows.length) return res.status(404).json({ ok:false,error:"Artist not found." });
        return res.status(200).json({ ok:true, deactivated:true });
      }
      const name = clean(req.body?.name, 100);
      const genre = clean(req.body?.genre, 80) || null;
      const imageUrl = req.body?.image_url ? safeUrl(req.body.image_url) : null;
      const profileUrl = req.body?.profile_url ? safeUrl(req.body.profile_url) : null;
      const sortOrder = Number.isInteger(Number(req.body?.sort_order)) ? Math.max(0, Math.min(100000, Number(req.body.sort_order))) : 0;
      if (!name) return res.status(400).json({ ok:false,error:"Artist name is required." });
      if ((req.body?.image_url && !imageUrl) || (req.body?.profile_url && !profileUrl)) return res.status(400).json({ ok:false,error:"Image and profile links must be valid HTTPS URLs." });
      if (action === "create_artist") {
        const rows = await auth.sql`INSERT INTO artists (name, genre, image_url, profile_url, is_active, sort_order) VALUES (${name}, ${genre}, ${imageUrl}, ${profileUrl}, ${req.body?.is_active !== false}, ${sortOrder}) RETURNING id, name, genre, image_url, profile_url, is_active, sort_order`;
        return res.status(201).json({ ok:true, artist:rows[0] });
      }
      if (!/^[0-9a-f-]{36}$/i.test(id)) return res.status(400).json({ ok:false,error:"Invalid artist." });
      const rows = await auth.sql`UPDATE artists SET name = ${name}, genre = ${genre}, image_url = ${imageUrl}, profile_url = ${profileUrl}, is_active = ${req.body?.is_active !== false}, sort_order = ${sortOrder} WHERE id = ${id} RETURNING id, name, genre, image_url, profile_url, is_active, sort_order`;
      if (!rows.length) return res.status(404).json({ ok:false,error:"Artist not found." });
      return res.status(200).json({ ok:true, artist:rows[0] });
    }
    if (action === "verify_artist_profile" || action === "reject_artist_profile") {
      const artistProfileId = String(req.body?.artistProfileId || "");
      if (!/^[0-9a-f-]{36}$/i.test(artistProfileId)) return res.status(400).json({ ok: false, error: "Invalid artist profile." });
      const status = action === "verify_artist_profile" ? "verified" : "rejected";
      const rows = await auth.sql`
        UPDATE artist_profiles
        SET verification_status = ${status},
            verified_at = CASE WHEN ${status} = 'verified' THEN now() ELSE verified_at END,
            verified_by = CASE WHEN ${status} = 'verified' THEN ${auth.profile.id} ELSE verified_by END
        WHERE id = ${artistProfileId} AND verification_status IN ('unverified','pending')
          AND (${status} <> 'verified' OR verification_payment_status = 'paid')
        RETURNING id, stage_name, verification_status
      `;
      if (!rows.length) return res.status(404).json({ ok: false, error: "Artist application not found." });
      return res.status(200).json({ ok: true, artist: rows[0] });
    }
    if (action === "publish_music_release" || action === "reject_music_release") {
      const releaseId = String(req.body?.releaseId || "");
      if (!/^[0-9a-f-]{36}$/i.test(releaseId)) return res.status(400).json({ ok: false, error: "Invalid music release." });
      const nextStatus = action === "publish_music_release" ? "published" : "rejected";
      const rows = await auth.sql`
        WITH changed AS (
          UPDATE music_releases
          SET status = ${nextStatus}
          WHERE id = ${releaseId} AND status IN ('submitted','under_review')
            AND (${nextStatus} <> 'published' OR EXISTS (SELECT 1 FROM artist_profiles ap WHERE ap.id = music_releases.artist_id AND ap.verification_status = 'verified'))
          RETURNING id, status
        ), changed_tracks AS (
          UPDATE music_tracks
          SET status = CASE WHEN ${nextStatus} = 'published' THEN 'published' ELSE 'rejected' END,
              published_at = CASE WHEN ${nextStatus} = 'published' THEN now() ELSE published_at END
          WHERE release_id IN (SELECT id FROM changed)
            AND status IN ('pending','approved')
          RETURNING id
        )
        SELECT changed.id, changed.status, (SELECT COUNT(*)::int FROM changed_tracks) AS tracks_updated
        FROM changed
      `;
      if (!rows.length) return res.status(404).json({ ok: false, error: "Submitted music release not found." });
      return res.status(200).json({ ok: true, release: rows[0] });
    }
    if (Object.hasOwn(opinionStatuses, action)) {
      if (!/^[0-9a-f-]{36}$/i.test(opinionId)) return res.status(400).json({ ok:false,error:"Invalid opinion." });
      const status = opinionStatuses[action];
      const auditAction = action === "approve" ? "approve_opinion" : action === "reject" ? "reject_opinion" : action;
      const rows = await auth.sql`WITH changed AS (
        UPDATE community_opinions SET status = ${status}, published_at = CASE WHEN ${status} = 'published' THEN COALESCE(published_at, now()) ELSE published_at END, moderated_by = ${auth.profile.id}, moderated_at = now(), moderation_note = ${reason}
        WHERE id = ${opinionId} RETURNING id, status
      ), logged AS (
        INSERT INTO moderation_actions (moderator_id, opinion_id, action, reason)
        SELECT ${auth.profile.id}, changed.id, ${auditAction}, ${reason || "Moderation review"} FROM changed RETURNING id
      ) SELECT changed.id, changed.status FROM changed`;
      if (!rows.length) return res.status(404).json({ ok:false,error:"Opinion not found." });
      return res.status(200).json({ ok:true, opinion:rows[0] });
    }
    if (action === "resolve_report" || action === "dismiss_report") {
      if (!/^[0-9a-f-]{36}$/i.test(reportId)) return res.status(400).json({ ok:false,error:"Invalid report." });
      const status = action === "resolve_report" ? "resolved" : "dismissed";
      const rows = await auth.sql`WITH changed AS (
        UPDATE opinion_reports SET status = ${status}, reviewed_by = ${auth.profile.id}, reviewed_at = now()
        WHERE id = ${reportId} AND status IN ('open','reviewing') RETURNING id, status, opinion_id
      ), logged AS (
        INSERT INTO moderation_actions (moderator_id, opinion_id, action, reason)
        SELECT ${auth.profile.id}, changed.opinion_id, ${action}, ${reason || status} FROM changed RETURNING id
      ) SELECT changed.id, changed.status, changed.opinion_id FROM changed`;
      if (!rows.length) return res.status(404).json({ ok:false,error:"Open report not found." });
      return res.status(200).json({ ok:true, report:rows[0] });
    }
    if (accountActions.includes(action)) {
      if (!/^[0-9a-f-]{36}$/i.test(targetUserId)) return res.status(400).json({ ok:false,error:"Invalid account." });
      if (targetUserId === auth.profile.id) return res.status(400).json({ ok:false,error:"You cannot change your own account status." });
      const status = action === "ban" ? "banned" : action === "suspend" ? "suspended" : "active";
      const until = action === "suspend" && req.body?.suspendedUntil ? new Date(req.body.suspendedUntil) : null;
      if (until && Number.isNaN(until.getTime())) return res.status(400).json({ ok:false,error:"Invalid suspension expiry." });
      const rows = await auth.sql`WITH changed AS (
        UPDATE user_profiles SET account_status = ${status}, suspended_until = ${status === "suspended" ? until : null}, moderation_note = ${reason}, moderated_at = now(), moderated_by = ${auth.profile.id}
        WHERE id = ${targetUserId} AND role <> 'super_admin' RETURNING id, account_status, suspended_until
      ), logged AS (
        INSERT INTO moderation_actions (moderator_id, target_user_id, action, reason)
        SELECT ${auth.profile.id}, changed.id, ${action}, ${reason || action} FROM changed RETURNING id
      ) SELECT changed.id, changed.account_status, changed.suspended_until FROM changed`;
      if (!rows.length) return res.status(404).json({ ok:false,error:"Account not found or protected." });
      return res.status(200).json({ ok:true, account:rows[0] });
    }
    return res.status(400).json({ ok:false,error:"Unsupported moderation action." });
  } catch (error) {
    console.error("Nochalant moderation action failed:", error?.message || error);
    return res.status(503).json({ ok:false,error:"The moderation action could not be completed." });
  }
}