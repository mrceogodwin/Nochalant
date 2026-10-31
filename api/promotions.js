import { requireActiveUser } from "./_lib/neon-auth.js";
import { randomUUID } from "node:crypto";
import { createMusicUploadUrl, createMusicDownloadUrl, verifyArtworkUpload, verifyPromotionVideoUpload } from "./_lib/music-storage.js";

const packages = {
  image_7d: { kind: "image", days: 7, NGN: 200000, USD: 199 },
  video_7d: { kind: "video", days: 7, NGN: 400000, USD: 399 },
  premium_14d: { kind: null, days: 14, NGN: 800000, USD: 799 },
  extended_30d: { kind: null, days: 30, NGN: 1500000, USD: 1499 }
};
const clean = (value, max = 180) => typeof value === "string" ? value.trim().slice(0, max) : "";
const safeHttps = value => { try { const u = new URL(clean(value, 1200)); return u.protocol === "https:" ? u.toString() : null; } catch { return null; } };

export default async function handler(req, res) {
  if (req.method === "GET") {
    const sqlUrl = process.env.DATABASE_URL_POOLED || process.env.DATABASE_URL;
    if (!sqlUrl) return res.status(503).json({ ok: false, error: "Promotions are temporarily unavailable." });
    try {
      const { neon } = await import("@neondatabase/serverless");
      const sql = neon(sqlUrl);
      const rows = await sql`
        SELECT id, campaign_type, media_kind, package_code, title, description, media_url, media_object_key,
               destination_url, contact_text, currency, starts_at, ends_at, impressions_count, clicks_count, created_at
        FROM promotion_campaigns
        WHERE status IN ('approved','active') AND payment_status = 'paid'
          AND (ends_at IS NULL OR ends_at > now())
        ORDER BY created_at DESC LIMIT 60
      `;
      const campaigns = await Promise.all(rows.map(async item => ({
        ...item,
        media_url: item.media_object_key ? await createMusicDownloadUrl(item.media_object_key, 1800) : item.media_url
      })));
      return res.status(200).json({ ok: true, campaigns });
    } catch (error) {
      console.error("Promotions listing failed:", error?.message || error);
      return res.status(503).json({ ok: false, error: "Promotions are temporarily unavailable." });
    }
  }
  if (req.method !== "POST") { res.setHeader("Allow", "GET, POST"); return res.status(405).json({ ok: false, error: "Method not allowed." }); }
  const auth = await requireActiveUser(req);
  if (auth.error) return res.status(auth.error.status).json({ ok: false, error: auth.error.message });
  try {
    const action = clean(req.body?.action, 40);
    if (action === "create_upload_url") {
      const kind = clean(req.body?.kind, 10);
      const contentType = clean(req.body?.contentType, 100).toLowerCase();
      const size = Number(req.body?.size);
      const images = { "image/jpeg":"jpg", "image/png":"png", "image/webp":"webp", "image/avif":"avif" };
      const videos = { "video/mp4":"mp4", "video/webm":"webm", "video/quicktime":"mov" };
      const extension = kind === "image" ? images[contentType] : kind === "video" ? videos[contentType] : null;
      const max = kind === "image" ? 15 * 1024 * 1024 : 200 * 1024 * 1024;
      if (!extension || !Number.isSafeInteger(size) || size < 1 || size > max) return res.status(400).json({ ok: false, error: kind === "video" ? "Use MP4, WebM or MOV video up to 200 MB." : "Use JPEG, PNG, WebP or AVIF images up to 15 MB." });
      const objectKey = "promotions/" + auth.profile.id + "/" + randomUUID() + "." + extension;
      const signed = await createMusicUploadUrl(objectKey, contentType);
      return res.status(200).json({ ok: true, objectKey, ...signed });
    }
    if (action === "create_campaign") {
      const title = clean(req.body?.title, 120);
      const description = clean(req.body?.description, 1200);
      const packageCode = clean(req.body?.packageCode, 30);
      const pkg = packages[packageCode];
      const kind = clean(req.body?.kind, 10);
      const objectKey = clean(req.body?.mediaObjectKey, 500);
      const destination = req.body?.destinationUrl ? safeHttps(req.body.destinationUrl) : null;
      const contact = clean(req.body?.contactText, 120);
      const currency = clean(req.body?.currency, 3).toUpperCase() === "USD" ? "USD" : "NGN";
      if (!pkg || !title || !kind || (pkg.kind && pkg.kind !== kind) || !objectKey.startsWith("promotions/" + auth.profile.id + "/") || objectKey.includes("..")) return res.status(400).json({ ok: false, error: "Complete the campaign details and choose a matching package." });
      if (req.body?.destinationUrl && !destination) return res.status(400).json({ ok: false, error: "Destination links must use HTTPS." });
      if (kind === "image") await verifyArtworkUpload(objectKey);\n      else await verifyPromotionVideoUpload(objectKey);
      // Campaigns remain pending payment and are never published by this endpoint.
      const amount = pkg[currency];
      const rows = await auth.sql`
        INSERT INTO promotion_campaigns
          (buyer_user_id, campaign_type, title, budget_minor, currency, status, sponsored_label_required,
           media_kind, package_code, description, media_object_key, destination_url, contact_text, payment_status)
        VALUES
          (${auth.profile.id}, 'featured_carousel', ${title}, ${amount}, ${currency}, 'pending_payment', true,
           ${kind}, ${packageCode}, ${description}, ${objectKey}, ${destination}, ${contact || null}, 'unpaid')
        RETURNING id, title, package_code, currency, budget_minor, status, payment_status, created_at
      `;
      return res.status(201).json({ ok: true, campaign: rows[0], message: "Campaign saved. Payment and admin review are required before it can go live." });
    }
    if (action === "admin_queue") {
      if (!["admin","super_admin","editor"].includes(auth.profile.role)) return res.status(403).json({ ok: false, error: "Administrator access required." });
      const rows = await auth.sql\`SELECT id, buyer_user_id, title, package_code, media_kind, currency, budget_minor, status, payment_status, media_object_key, created_at FROM promotion_campaigns WHERE status IN ('pending_payment','pending_review') ORDER BY created_at ASC LIMIT 100\`;
      return res.status(200).json({ ok: true, campaigns: rows });
    }
    if (action === "moderate") {
      if (!["admin","super_admin","editor"].includes(auth.profile.role)) return res.status(403).json({ ok: false, error: "Administrator access required." });
      const id = clean(req.body?.campaignId, 50);
      const decision = clean(req.body?.decision, 20);
      if (!/^[0-9a-f-]{36}$/i.test(id) || !["approve","reject"].includes(decision)) return res.status(400).json({ ok: false, error: "Choose a valid campaign and decision." });
      const rows = await auth.sql\`UPDATE promotion_campaigns SET status = CASE WHEN \${decision} = 'approve' THEN 'approved' ELSE 'rejected' END, reviewed_by = \${auth.profile.id}, reviewed_at = now() WHERE id = \${id} AND payment_status = 'paid' AND status = 'pending_review' RETURNING id, status\`;
      if (!rows.length) return res.status(409).json({ ok: false, error: "Campaign must have confirmed payment and be awaiting review." });
      return res.status(200).json({ ok: true, campaign: rows[0] });
    }
    if (action === "my_campaigns") {
      const rows = await auth.sql`
        SELECT id, title, package_code, media_kind, currency, budget_minor, status, payment_status,
               starts_at, ends_at, impressions_count, clicks_count, rejection_reason, created_at
        FROM promotion_campaigns WHERE buyer_user_id = ${auth.profile.id}
        ORDER BY created_at DESC LIMIT 50
      `;
      return res.status(200).json({ ok: true, campaigns: rows });
    }
    return res.status(400).json({ ok: false, error: "Unsupported promotions action." });
  } catch (error) {
    console.error("Promotions action failed:", error?.message || error);
    return res.status(503).json({ ok: false, error: "Your promotion could not be processed right now." });
  }
}
