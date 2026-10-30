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
      SELECT id, name, genre, image_url, profile_url
      FROM artists
      WHERE is_active = true
      ORDER BY sort_order ASC, name ASC
      LIMIT 24
    `;

    return res.status(200).json({
      ok: true,
      artists: rows.map((artist) => ({
        ...artist,
        image_url: safeHttpsUrl(artist.image_url),
        profile_url: safeHttpsUrl(artist.profile_url)
      }))
    });
  } catch (error) {
    console.error("Nochalant artist spotlight query failed:", error?.message || error);
    return res.status(503).json({ ok: false, error: "Artist spotlight is temporarily unavailable" });
  }
}
