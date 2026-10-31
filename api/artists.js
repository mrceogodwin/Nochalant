import { neon } from "@neondatabase/serverless";

const safeHttpsUrl = (value) => {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
};

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const connectionString = process.env.DATABASE_URL_POOLED || process.env.DATABASE_URL;
  if (!connectionString) {
    return res.status(503).json({ ok: false, error: "Artist spotlight is temporarily unavailable" });
  }

  try {
    const sql = neon(connectionString);
    const rows = await sql`
      SELECT ap.id, ap.stage_name AS name, ap.slug, ap.avatar_url AS image_url,
             ap.city, ap.country_code, ap.verification_status,
             COALESCE(m.genre, 'Afrobeats') AS genre,
             COALESCE(m.download_count, 0)::bigint AS download_count,
             COALESCE(m.track_count, 0)::int AS track_count
      FROM artist_profiles ap
      LEFT JOIN LATERAL (
        SELECT
          (SELECT mr.genre FROM music_releases mr
           WHERE mr.artist_id = ap.id AND mr.status = 'published'
           ORDER BY mr.release_date DESC NULLS LAST LIMIT 1) AS genre,
          COUNT(mt.id) FILTER (WHERE mt.status = 'published') AS track_count,
          COALESCE(SUM(mt.download_count) FILTER (WHERE mt.status = 'published'), 0) AS download_count
        FROM music_tracks mt
        WHERE mt.artist_id = ap.id
      ) m ON true
      WHERE ap.verification_status = 'verified'
      ORDER BY track_count DESC, download_count DESC, ap.stage_name ASC
      LIMIT 24
    `;

    return res.status(200).json({
      ok: true,
      artists: rows.map((artist) => ({
        id: artist.id,
        name: artist.name,
        genre: artist.genre,
        image_url: safeHttpsUrl(artist.image_url),
        profile_url: null,
        download_count: Number(artist.download_count || 0),
        track_count: Number(artist.track_count || 0)
      }))
    });
  } catch (error) {
    console.error("Nochalant artist spotlight query failed:", error?.message || error);
    return res.status(503).json({ ok: false, error: "Artist spotlight is temporarily unavailable" });
  }
}
