import { createHash } from "node:crypto";
import { neon } from "@neondatabase/serverless";

const hash = (value) => createHash("sha256").update(String(value)).digest("hex");

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }
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
    if (listenedSeconds < eligibleSeconds) {
      return res.status(202).json({ ok: true, counted: false, required_seconds: eligibleSeconds });
    }
    const sessionHash = hash(sessionId);
    const eventId = hash(`nochalant:${trackId}:${sessionHash}:${new Date().toISOString().slice(0, 10)}`);
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
