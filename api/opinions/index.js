import { requireActiveUser } from "../_lib/neon-auth.js";
import { resolveMusicAssetUrl } from "../_lib/music-storage.js";

export default async function handler(req, res) {
  if (req.method === "POST") {
    const auth = await requireActiveUser(req);
    if (auth.error) return res.status(auth.error.status).json({ ok: false, error: auth.error.message });
    const body = typeof req.body?.body === "string" ? req.body.body.trim() : "";
    const topic = typeof req.body?.topic === "string" ? req.body.topic : "Culture";
    const allowedTopics = ["Music","Entertainment","Fashion","Lifestyle","Nightlife","Sports","Culture","Other"];
    if (body.length < 8 || body.length > 500) return res.status(400).json({ ok: false, error: "Opinions must be between 8 and 500 characters." });
    if (!allowedTopics.includes(topic)) return res.status(400).json({ ok: false, error: "Choose a valid opinion topic." });
    try {
      const rows = await auth.sql`INSERT INTO community_opinions (author_id, body, topic, status)
        VALUES (${auth.profile.id}, ${body}, ${topic}, 'pending')
        RETURNING id, body, topic, status, created_at`;
      return res.status(201).json({ ok: true, opinion: rows[0], message: "Your opinion has been submitted for review." });
    } catch (error) {
      console.error("Nochalant opinion submission failed:", error?.message || error);
      return res.status(503).json({ ok: false, error: "We couldn't save your opinion. Please try again." });
    }
  }
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }
  const auth = await requireActiveUser(req);
  if (auth.error) return res.status(auth.error.status).json({ ok: false, error: auth.error.message });
  try {
    const rows = await auth.sql`
      SELECT o.id, o.body, o.topic, o.published_at,
             p.display_name AS author_name, d.avatar_url
      FROM community_opinions o
      JOIN user_profiles p ON p.id = o.author_id
      LEFT JOIN user_profile_details d ON d.user_profile_id = p.id
      WHERE o.status = 'published'
        AND p.account_status = 'active'
      ORDER BY o.featured DESC, o.published_at DESC NULLS LAST, o.created_at DESC
      LIMIT 30
    `;
    const opinions = await Promise.all(rows.map(async row => ({ ...row, avatar_url: await resolveMusicAssetUrl(row.avatar_url) })));
    return res.status(200).json({ ok: true, opinions });
  } catch (error) {
    console.error("Nochalant opinions feed failed:", error?.message || error);
    return res.status(503).json({ ok: false, error: "Opinions are temporarily unavailable." });
  }
}
