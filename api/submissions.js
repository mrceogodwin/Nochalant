import { createHash } from "node:crypto";
import { requireActiveUser } from "./_lib/neon-auth.js";

const allowedCategories = ["Lifestyle","Clubs & Nightlife","Entertainment","Music","Nollywood","Street Buzz","Business","Agenda"];

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed." });
  }

  const auth = await requireActiveUser(req);
  if (auth.error) return res.status(auth.error.status).json({ ok: false, error: auth.error.message });

  const title = typeof req.body?.title === "string" ? req.body.title.trim() : "";
  const body = typeof req.body?.body === "string" ? req.body.body.trim() : "";
  const category = typeof req.body?.category === "string" ? req.body.category : "";
  const sourceUrl = typeof req.body?.source_url === "string" ? req.body.source_url.trim() : "";

  if (title.length < 8 || title.length > 180) return res.status(400).json({ ok: false, error: "Title must be between 8 and 180 characters." });
  if (body.length < 20 || body.length > 12000) return res.status(400).json({ ok: false, error: "Your gist must be between 20 and 12,000 characters." });
  if (!allowedCategories.includes(category)) return res.status(400).json({ ok: false, error: "Choose a valid category." });
  if (sourceUrl) {
    try {
      const parsed = new URL(sourceUrl);
      if (!["http:", "https:"].includes(parsed.protocol)) throw new Error("Invalid protocol");
    } catch {
      return res.status(400).json({ ok: false, error: "Add a valid http or https source link, or leave it blank." });
    }
  }

  const fingerprint = createHash("sha256").update(title.toLowerCase().replace(/\\s+/g, " ") + "\\n" + body.toLowerCase().replace(/\\s+/g, " ")).digest("hex");
  try {
    const rows = await auth.sql`
      INSERT INTO submissions (author_id, title, body, category, source_url, content_fingerprint, submission_type, status)
      VALUES (${auth.profile.id}, ${title}, ${body}, ${category}, ${sourceUrl || null}, ${fingerprint}, 'free', 'pending')
      RETURNING id, title, category, status, submission_day, created_at
    `;
    return res.status(201).json({ ok: true, submission: rows[0], message: "Your gist has been received and is awaiting editorial review." });
  } catch (error) {
    if (error?.code === "23505") {
      const constraint = String(error?.constraint || "");
      if (constraint.includes("one_free_per_day")) return res.status(409).json({ ok: false, error: "You've used your free submission for today. Please come back tomorrow." });
      return res.status(409).json({ ok: false, error: "This gist appears to have already been submitted." });
    }
    console.error("Nochalant submission save failed:", error?.message || error);
    return res.status(503).json({ ok: false, error: "We couldn't save your gist right now. Please try again." });
  }
}
