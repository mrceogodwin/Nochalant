import { requireActiveUser } from "./neon-auth.js";

const clean = (value, max = 180) => typeof value === "string" ? value.trim().slice(0, max) : "";
const safeHttps = (value) => {
  const raw = clean(value, 1200);
  if (!raw) return null;
  try {
    const url = new URL(raw);
    return url.protocol === "https:" ? url.toString() : null;
  } catch { return null; }
};

export async function handleArtistStudio(req, res) {
  if (!["GET", "POST"].includes(req.method)) {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }
  const auth = await requireActiveUser(req);
  if (auth.error) return res.status(auth.error.status).json({ ok: false, error: auth.error.message });
  if (auth.profile.account_type !== "artist") {
    return res.status(403).json({ ok: false, error: "This studio is available to Artist accounts." });
  }

  try {
    const artists = await auth.sql`
      SELECT id, stage_name, slug, bio, avatar_url, banner_url, country_code, city, verification_status
      FROM artist_profiles WHERE owner_user_id = ${auth.profile.id} LIMIT 1
    `;
    const artist = artists[0];
    if (!artist) return res.status(409).json({ ok: false, error: "Your artist profile has not been created yet." });

    if (req.method === "GET") {
      const [releases, stats] = await Promise.all([
        auth.sql`
          SELECT mr.id, mr.title, mr.release_type, mr.cover_art_url, mr.release_date, mr.genre, mr.status,
                 mr.created_at, COUNT(mt.id)::int AS track_count
          FROM music_releases mr
          LEFT JOIN music_tracks mt ON mt.release_id = mr.id
          WHERE mr.artist_id = ${artist.id}
          GROUP BY mr.id
          ORDER BY mr.created_at DESC LIMIT 50
        `,
        auth.sql`
          SELECT COUNT(*) FILTER (WHERE status = 'published')::int AS published_tracks,
                 COALESCE(SUM(download_count),0)::bigint AS downloads
          FROM music_tracks WHERE artist_id = ${artist.id}
        `
      ]);
      return res.status(200).json({ ok: true, artist, releases, stats: stats[0] || { published_tracks: 0, downloads: 0 } });
    }

    const action = clean(req.body?.action, 40);
    if (action === "update_profile") {
      const stageName = clean(req.body?.stageName, 100);
      const bio = clean(req.body?.bio, 3000);
      const city = clean(req.body?.city, 100);
      const avatarUrl = req.body?.avatarUrl ? safeHttps(req.body.avatarUrl) : null;
      const bannerUrl = req.body?.bannerUrl ? safeHttps(req.body.bannerUrl) : null;
      if (!stageName) return res.status(400).json({ ok: false, error: "Artist or stage name is required." });
      if ((req.body?.avatarUrl && !avatarUrl) || (req.body?.bannerUrl && !bannerUrl)) {
        return res.status(400).json({ ok: false, error: "Profile image links must be valid HTTPS URLs." });
      }
      const rows = await auth.sql`
        UPDATE artist_profiles
        SET stage_name = ${stageName}, bio = ${bio}, city = ${city || null},
            avatar_url = ${avatarUrl}, banner_url = ${bannerUrl}
        WHERE id = ${artist.id} AND owner_user_id = ${auth.profile.id}
        RETURNING id, stage_name, slug, bio, avatar_url, banner_url, country_code, city, verification_status
      `;
      return res.status(200).json({ ok: true, artist: rows[0] });
    }

    if (action === "create_release") {
      const title = clean(req.body?.title, 180);
      const genre = clean(req.body?.genre, 80);
      const releaseType = clean(req.body?.releaseType, 20);
      const releaseDate = clean(req.body?.releaseDate, 10) || null;
      const coverArtUrl = req.body?.coverArtUrl ? safeHttps(req.body.coverArtUrl) : null;
      if (!title || !genre || !["single", "ep", "album", "mixtape"].includes(releaseType)) {
        return res.status(400).json({ ok: false, error: "Enter a release title, genre and valid release type." });
      }
      if (req.body?.coverArtUrl && !coverArtUrl) return res.status(400).json({ ok: false, error: "Cover artwork must use a valid HTTPS URL." });
      if (releaseDate && !/^\d{4}-\d{2}-\d{2}$/.test(releaseDate)) return res.status(400).json({ ok: false, error: "Release date must use YYYY-MM-DD." });
      const rows = await auth.sql`
        INSERT INTO music_releases (artist_id, title, release_type, cover_art_url, release_date, genre, status)
        VALUES (${artist.id}, ${title}, ${releaseType}, ${coverArtUrl}, ${releaseDate}, ${genre}, 'draft')
        RETURNING id, title, release_type, cover_art_url, release_date, genre, status, created_at
      `;
      return res.status(201).json({ ok: true, release: rows[0] });
    }

    if (action === "add_track") {
      const releaseId = clean(req.body?.releaseId, 50);
      const title = clean(req.body?.title, 180);
      const audioUrl = safeHttps(req.body?.audioUrl);
      const durationSeconds = Number(req.body?.durationSeconds) || null;
      const isrc = clean(req.body?.isrc, 20) || null;
      if (!/^[0-9a-f-]{36}$/i.test(releaseId) || !title || !audioUrl) {
        return res.status(400).json({ ok: false, error: "Choose a draft release, enter a track title and provide a valid HTTPS audio URL." });
      }
      if (durationSeconds !== null && (!Number.isInteger(durationSeconds) || durationSeconds < 1 || durationSeconds > 86400)) {
        return res.status(400).json({ ok: false, error: "Track duration must be a positive number of seconds." });
      }
      const release = await auth.sql`
        SELECT id FROM music_releases
        WHERE id = ${releaseId} AND artist_id = ${artist.id} AND status = 'draft'
        LIMIT 1
      `;
      if (!release.length) return res.status(409).json({ ok: false, error: "Tracks can only be added to your own draft releases." });
      const rows = await auth.sql`
        INSERT INTO music_tracks
          (release_id, artist_id, title, audio_object_key, duration_seconds, isrc, status)
        VALUES
          (${releaseId}, ${artist.id}, ${title}, ${audioUrl}, ${durationSeconds}, ${isrc}, 'pending')
        RETURNING id, release_id, title, duration_seconds, status, created_at
      `;
      return res.status(201).json({ ok: true, track: rows[0] });
    }

    if (action === "submit_release") {
      const releaseId = clean(req.body?.releaseId, 50);
      if (!/^[0-9a-f-]{36}$/i.test(releaseId)) return res.status(400).json({ ok: false, error: "Select a valid release." });
      const rows = await auth.sql`
        UPDATE music_releases
        SET status = 'submitted'
        WHERE id = ${releaseId} AND artist_id = ${artist.id} AND status = 'draft'
        RETURNING id, title, status
      `;
      if (!rows.length) return res.status(409).json({ ok: false, error: "This release cannot be submitted. It may already be under review." });
      return res.status(200).json({ ok: true, release: rows[0] });
    }

    return res.status(400).json({ ok: false, error: "Unsupported artist studio action." });
  } catch (error) {
    console.error("Nochalant artist studio failed:", error?.message || error);
    return res.status(503).json({ ok: false, error: "Artist studio is temporarily unavailable." });
  }
}
