import { createHash, randomUUID } from "node:crypto";
import { neon } from "@neondatabase/serverless";

const COOKIE_NAME = "nochalant_visitor";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

function readCookie(header, name) {
  const entry = String(header || "").split(";").map(part => part.trim()).find(part => part.startsWith(name + "="));
  return entry ? decodeURIComponent(entry.slice(name.length + 1)) : "";
}

export default async function handler(req, res) {
  const slug = String(req.query?.slug || "").toLowerCase();
  if (!/^[a-z0-9_-]{1,80}$/.test(slug)) {
    return res.status(400).json({ ok: false, error: "Invalid post identifier" });
  }
  if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const connectionString = process.env.DATABASE_URL_POOLED || process.env.DATABASE_URL;
  if (!connectionString) {
    return res.status(503).json({ ok: false, error: "Reader counts are not configured yet" });
  }

  try {
    const sql = neon(connectionString);
    if (req.method === "POST") {
      let visitorToken = readCookie(req.headers.cookie, COOKIE_NAME);
      if (!/^[a-f0-9-]{36}$/i.test(visitorToken)) {
        visitorToken = randomUUID();
        res.setHeader("Set-Cookie", `${COOKIE_NAME}=${encodeURIComponent(visitorToken)}; Path=/; Max-Age=${COOKIE_MAX_AGE}; HttpOnly; Secure; SameSite=Lax`);
      }
      const visitorHash = createHash("sha256").update(visitorToken).digest("hex");
      await sql`INSERT INTO post_view_counts (post_slug) VALUES (${slug}) ON CONFLICT (post_slug) DO NOTHING`;
      const inserted = await sql`INSERT INTO post_viewers (post_slug, visitor_hash) VALUES (${slug}, ${visitorHash}) ON CONFLICT DO NOTHING RETURNING post_slug`;
      if (inserted.length) {
        await sql`UPDATE post_view_counts SET view_count = view_count + 1, updated_at = now() WHERE post_slug = ${slug}`;
      }
    }

    const rows = await sql`SELECT view_count FROM post_view_counts WHERE post_slug = ${slug}`;
    return res.status(200).json({ ok: true, slug, views: Number(rows[0]?.view_count || 0) });
  } catch (error) {
    console.error("Article view counter failed:", error?.message || error);
    return res.status(503).json({ ok: false, error: "Reader count is temporarily unavailable" });
  }
}
