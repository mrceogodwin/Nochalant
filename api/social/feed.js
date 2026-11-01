import { requireActiveUser } from "../_lib/neon-auth.js";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("Vary", "Authorization");
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const auth = await requireActiveUser(req);
  if (auth.error) return res.status(auth.error.status).json({ ok: false, error: auth.error.message });

  try {
    const posts = await auth.sql`
      SELECT o.id, o.body, o.topic, o.published_at,
             p.display_name AS author_name
      FROM community_opinions o
      JOIN user_profiles p ON p.id = o.author_id
      WHERE o.status = 'published'
        AND p.account_status = 'active'
      ORDER BY o.featured DESC, o.published_at DESC NULLS LAST, o.created_at DESC
      LIMIT 30
    `;
    return res.status(200).json({ ok: true, posts });
  } catch (error) {
    console.error("Nochalant member social feed failed:", error?.message || error);
    return res.status(503).json({ ok: false, error: "The social feed is temporarily unavailable." });
  }
}
