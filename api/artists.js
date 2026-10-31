import { createHash } from "node:crypto";
import { neon } from "@neondatabase/serverless";

const safeHttpsUrl = (value) => {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : null;
  } catch { return null; }
};

const mapTrack = (track) => ({
  id: track.id,
  title: track.title,
  release_title: track.release_title,
  release_type: track.release_type,
  cover_art_url: safeHttpsUrl(track.cover_art_url) || safeHttpsUrl(track.artist_image_url),
  artist_id: track.artist_id,
  artist_name: track.artist_name,
  artist_slug: track.artist_slug,
  artist_image_url: safeHttpsUrl(track.artist_image_url),
  duration_seconds: track.duration_seconds ? Number(track.duration_seconds) : null,
  genre: track.genre,
  release_date: track.release_date,
  plays_count: Number(track.plays_count || 0),
  download_count: Number(track.download_count || 0),
  audio_url: safeHttpsUrl(track.audio_object_key)
});

export default async function handler(req, res) {
  if (req.method === "POST") {
    const trackId = String(req.body?.trackId || "");
    const sessionId = String(req.body?.sessionId || "").slice(0, 180);
    const listenedSeconds = Math.max(0, Math.min(86400, Number(req.body?.listenedSeconds) || 0));
    if (!/^[0-9a-f-]{36}$/i.test(trackId) || sessionId.length < 12) {
      return res.status(400).json({ ok: false, error: "A valid track and listening session are required." });
    }
    const connectionString = process.env.DATABASE_URL_POOLED || process.env.DATABASE_URL;
    if (!connectionString) return res.status(503).json({ ok: false, error: "Play tracking is temporarily unavailable." });
    try {
      const sql = neon(connectionString);
      const rows = await sql`SELECT id, duration_seconds FROM music_tracks WHERE id = ${trackId} AND status = 'published' LIMIT 1`;
      if (!rows.length) return res.status(404).json({ ok: false, error: "Published track not found." });
      const duration = Number(rows[0].duration_seconds || 0);
      const eligibleSeconds = duration > 0 && duration < 30 ? Math.ceil(duration * 0.8) : 30;
      if (listenedSeconds < eligibleSeconds) return res.status(202).json({ ok: true, counted: false, required_seconds: eligibleSeconds });
      const hash = value => createHash("sha256").update(String(value)).digest("hex");
      const sessionHash = hash(sessionId);
      const eventId = hash("nochalant:" + trackId + ":" + sessionHash + ":" + new Date().toISOString().slice(0, 10));
      await sql`
        INSERT INTO music_play_events
          (track_id, anonymous_listener_hash, session_hash, provider_event_id, listened_seconds, duration_seconds, eligible, source)
        VALUES
          (${trackId}, ${sessionHash}, ${sessionHash}, ${eventId}, ${Math.floor(listenedSeconds)}, ${duration || null}, true, 'nochalant')
        ON CONFLICT (provider_event_id) DO NOTHING
      `;
      const counts = await sql`SELECT COUNT(*)::bigint AS plays_count FROM music_play_events WHERE track_id = ${trackId} AND eligible = true`;
      return res.status(200).json({ ok: true, counted: true, plays_count: Number(counts[0]?.plays_count || 0) });
    } catch (error) {
      console.error("Nochalant play tracking failed:", error?.message || error);
      return res.status(503).json({ ok: false, error: "Play tracking is temporarily unavailable." });
    }
  }
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }
  const connectionString = process.env.DATABASE_URL_POOLED || process.env.DATABASE_URL;
  if (!connectionString) return res.status(503).json({ ok: false, error: "Artist spotlight is temporarily unavailable" });

  try {
    const sql = neon(connectionString);
    if (typeof req.query?.download === "string") {
      const trackId = req.query.download.trim();
      if (!/^[0-9a-f-]{36}$/i.test(trackId)) return res.status(400).json({ ok: false, error: "Invalid track." });
      const rows = await sql`SELECT audio_object_key FROM music_tracks WHERE id = ${trackId} AND status = 'published' LIMIT 1`;
      const downloadUrl = safeHttpsUrl(rows[0]?.audio_object_key);
      if (!downloadUrl) return res.status(404).json({ ok: false, error: "This track does not have a downloadable audio file yet." });
      await sql`UPDATE music_tracks SET download_count = download_count + 1 WHERE id = ${trackId} AND status = 'published'`;
      return res.redirect(302, downloadUrl);
    }
    const slug = typeof req.query?.slug === "string" ? req.query.slug.trim().slice(0, 100) : "";
    const artistRows = await sql`
      SELECT ap.id, ap.stage_name AS name, ap.slug, ap.bio, ap.avatar_url AS image_url,
             ap.banner_url, ap.city, ap.country_code, ap.verification_status
      FROM artist_profiles ap
      WHERE ap.verification_status = 'verified'
        AND (${slug || null}::text IS NULL OR ap.slug = ${slug || null})
      ORDER BY ap.stage_name ASC
      LIMIT 24
    `;
    if (slug && !artistRows.length) return res.status(404).json({ ok: false, error: "Artist not found." });
    const ids = artistRows.map(row => row.id);
    if (!ids.length) return res.status(200).json({ ok: true, artists: [], tracks: [], artist: null });

    const trackRows = await sql`
      SELECT mt.id, mt.title, mt.audio_object_key, mt.duration_seconds, mt.download_count,
             mt.artist_id, mr.title AS release_title, mr.release_type, mr.cover_art_url,
             mr.genre, mr.release_date, ap.stage_name AS artist_name, ap.slug AS artist_slug,
             ap.avatar_url AS artist_image_url,
             COUNT(mpe.id) FILTER (WHERE mpe.eligible = true)::bigint AS plays_count
      FROM music_tracks mt
      JOIN music_releases mr ON mr.id = mt.release_id AND mr.status = 'published'
      JOIN artist_profiles ap ON ap.id = mt.artist_id AND ap.verification_status = 'verified'
      LEFT JOIN music_play_events mpe ON mpe.track_id = mt.id
      WHERE mt.artist_id = ANY(${ids}::uuid[])
        AND mt.status = 'published'
      GROUP BY mt.id, mr.id, ap.id
      ORDER BY mt.published_at DESC NULLS LAST, mr.release_date DESC NULLS LAST, mt.created_at DESC
      LIMIT 120
    `;
    const tracks = trackRows.map(mapTrack);
    const artists = artistRows.map(artist => {
      const artistTracks = tracks.filter(track => track.artist_id === artist.id);
      return {
        id: artist.id, name: artist.name, slug: artist.slug, bio: artist.bio,
        image_url: safeHttpsUrl(artist.image_url), banner_url: safeHttpsUrl(artist.banner_url),
        city: artist.city, country_code: artist.country_code,
        genre: artistTracks[0]?.genre || null,
        track_count: artistTracks.length,
        plays_count: artistTracks.reduce((sum, track) => sum + track.plays_count, 0),
        download_count: artistTracks.reduce((sum, track) => sum + track.download_count, 0),
        tracks: artistTracks
      };
    });
    if (slug) return res.status(200).json({ ok: true, artist: artists[0], tracks: artists[0].tracks });
    return res.status(200).json({ ok: true, artists, tracks });
  } catch (error) {
    console.error("Nochalant artist spotlight query failed:", error?.message || error);
    return res.status(503).json({ ok: false, error: "Artist spotlight is temporarily unavailable" });
  }
}
