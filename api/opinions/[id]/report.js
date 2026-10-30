import { requireActiveUser } from "../../_lib/neon-auth.js";

const reasons = ["Harassment or bullying","Hate or discrimination","Sexual content","Violence or threats","Spam or scam","False or harmful information","Other"];

export default async function handler(req, res) {
  if (req.method !== "POST") { res.setHeader("Allow", "POST"); return res.status(405).json({ ok: false, error: "Method not allowed" }); }
  const auth = await requireActiveUser(req);
  if (auth.error) return res.status(auth.error.status).json({ ok: false, error: auth.error.message });
  const opinionId = String(req.query?.id || "");
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(opinionId)) return res.status(400).json({ ok: false, error: "Invalid opinion." });
  const reason = typeof req.body?.reason === "string" ? req.body.reason : "";
  const details = typeof req.body?.details === "string" ? req.body.details.trim() : "";
  if (!reasons.includes(reason) || details.length > 500) return res.status(400).json({ ok: false, error: "Choose a valid reason and keep details under 500 characters." });
  try {
    const rows = await auth.sql`
      INSERT INTO opinion_reports (opinion_id, reporter_id, reason, details)
      SELECT o.id, ${auth.profile.id}, ${reason}, ${details}
      FROM community_opinions o WHERE o.id = ${opinionId} AND o.status IN ('pending','published','hidden') AND o.author_id <> ${auth.profile.id}
      RETURNING id, opinion_id, status, created_at
    `;
    if (!rows.length) return res.status(404).json({ ok: false, error: "This opinion cannot be reported." });
    return res.status(201).json({ ok: true, report: rows[0], message: "Thank you. Your report has been sent for review." });
  } catch (error) {
    if (error?.code === "23505") return res.status(409).json({ ok: false, error: "You have already reported this opinion." });
    console.error("Nochalant opinion report failed:", error?.message || error);
    return res.status(503).json({ ok: false, error: "We couldn't send your report. Please try again." });
  }
}