import { requireActiveUser } from "../_lib/neon-auth.js";

export default async function handler(req, res) {
  if (req.method !== "GET") { res.setHeader("Allow", "GET"); return res.status(405).json({ ok: false, error: "Method not allowed" }); }
  const auth = await requireActiveUser(req);
  if (auth.error) return res.status(auth.error.status).json({ ok: false, error: auth.error.message });
  try {
    const opinions = await auth.sql`
      SELECT id, body, topic, status, moderation_note, created_at, published_at
      FROM community_opinions WHERE author_id = ${auth.profile.id}
      ORDER BY created_at DESC LIMIT 100
    `;
    return res.status(200).json({ ok: true, opinions });
  } catch (error) {
    console.error("Nochalant user opinions failed:", error?.message || error);
    return res.status(503).json({ ok: false, error: "Your opinions are temporarily unavailable." });
  }
}