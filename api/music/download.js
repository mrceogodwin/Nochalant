import { neon } from "@neondatabase/serverless";

const safeHttps = (value) => {
  try {
    const url = new URL(String(value || ""));
    return url.protocol === "https:" ? url.toString() : null;
  } catch { return null; }
};

export default async function handler(req, res) {
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
      SELECT mt.id, mt.audio_object_key
      FROM music_tracks mt
      JOIN music_releases mr ON mr.id = mt.release_id AND mr.status = 'published'
      JOIN artist_profiles ap ON ap.id = mt.artist_id AND ap.verification_status = 'verified'
      WHERE mt.id = ${trackId} AND mt.status = 'published'
      LIMIT 1
    `;
    if (!rows.length) return res.status(404).json({ ok: false, error: "This track is not available for download." });
    const audioUrl = safeHttps(rows[0].audio_object_key);
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
