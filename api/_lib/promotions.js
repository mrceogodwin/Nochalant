import { requireActiveUser } from "./neon-auth.js";
import { randomUUID } from "node:crypto";
import { createMusicUploadUrl, createMusicDownloadUrl, verifyArtworkUpload, verifyPromotionVideoUpload } from "./music-storage.js";

const packages = {
  image_7d: { kind: "image", days: 7, NGN: 200000, USD: 199 },
  video_7d: { kind: "video", days: 7, NGN: 400000, USD: 399 },
  premium_14d: { kind: null, days: 14, NGN: 800000, USD: 799 },
  extended_30d: { kind: null, days: 30, NGN: 1500000, USD: 1499 }
};
const clean = (value, max = 180) => typeof value === "string" ? value.trim().slice(0, max) : "";
const safeHttps = value => { try { const u = new URL(clean(value, 1200)); return u.protocol === "https:" ? u.toString() : null; } catch { return null; } };

export async function handlePromotions(req, res) {
  if (req.method === "GET") {
    const sqlUrl = process.env.DATABASE_URL_POOLED || process.env.DATABASE_URL;
    if (!sqlUrl) return res.status(503).json({ ok: false, error: "Promotions are temporarily unavailable." });
    try {
      const { neon } = await import("@neondatabase/serverless");
      const sql = neon(sqlUrl);
      const rows = await sql`
        SELECT id, campaign_type, media_kind, package_code, title, description, media_url, media_object_key,
               destination_url, contact_text, currency, design_config, starts_at, ends_at, impressions_count, clicks_count, created_at
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
      const isText = kind === "text";
      const textBody = clean(req.body?.textBody, 700);
      const design = req.body?.designConfig && typeof req.body.designConfig === "object" ? req.body.designConfig : {};
      const allowed = { theme: ["midnight","lime","cream","ember"], layout: ["editorial","poster","minimal"], alignment: ["left","center"], icon: ["none","spark","star","bolt","heart","music","megaphone"], font: ["modern","serif","mono"] };
      const defaults = { theme: "midnight", layout: "editorial", alignment: "left", icon: "none", font: "modern" };
      const designConfig = Object.fromEntries(Object.entries(allowed).map(([key, values]) => [key, values.includes(design[key]) ? design[key] : defaults[key]]));
      if (!pkg || !title || !["image","video","text"].includes(kind) || (pkg.kind && pkg.kind !== kind) || (isText && textBody.length < 12) || (!isText && (!objectKey.startsWith("promotions/" + auth.profile.id + "/") || objectKey.includes("..")))) return res.status(400).json({ ok: false, error: "Complete the campaign details and choose a matching package." });
      if (req.body?.destinationUrl && !destination) return res.status(400).json({ ok: false, error: "Destination links must use HTTPS." });
      if (!isText && kind === "image") await verifyArtworkUpload(objectKey);
      if (!isText && kind === "video") await verifyPromotionVideoUpload(objectKey);
      const amount = pkg[currency];
      const rows = await auth.sql`
        INSERT INTO promotion_campaigns
          (buyer_user_id, campaign_type, title, budget_minor, currency, status, sponsored_label_required, media_kind, package_code, description, media_object_key, destination_url, contact_text, payment_status, design_config)
        VALUES
          (${auth.profile.id}, 'featured_carousel', ${title}, ${amount}, ${currency}, 'pending_payment', true, ${kind}, ${packageCode}, ${isText ? textBody : description}, ${isText ? null : objectKey}, ${destination}, ${contact || null}, 'unpaid', ${JSON.stringify(designConfig)}::jsonb)
        RETURNING id, title, package_code, currency, budget_minor, status, payment_status, created_at
      `;
      return res.status(201).json({ ok: true, campaign: rows[0], message: "Campaign saved. Payment and admin review are required before it can go live." });
    }
    if (action === "create_checkout") {
      const campaignId = clean(req.body?.campaignId, 50);
      if (!/^[0-9a-f-]{36}$/i.test(campaignId)) return res.status(400).json({ ok: false, error: "Choose a valid campaign." });
      const apiKey = process.env.BACHS_API_KEY || process.env.BACHS_SECRET_KEY;
      if (!apiKey || (!apiKey.startsWith("sk_sandbox_") && !apiKey.startsWith("sk_live_")) || !process.env.BACHS_WEBHOOK_SECRET) {
        return res.status(503).json({ ok: false, error: "Bachs API and webhook credentials must both be configured before checkout can accept payment." });
      }
      const campaignRows = await auth.sql`SELECT id, title, budget_minor, currency, payment_status, status FROM promotion_campaigns WHERE id = ${campaignId} AND buyer_user_id = ${auth.profile.id} LIMIT 1`;
      const campaign = campaignRows[0];
      if (!campaign) return res.status(404).json({ ok: false, error: "Campaign not found." });
      if (campaign.payment_status === "paid") return res.status(409).json({ ok: false, error: "This campaign has already been paid." });
      if (campaign.status !== "pending_payment") return res.status(409).json({ ok: false, error: "This campaign is not awaiting payment." });
      const amount = (Number(campaign.budget_minor) / 100).toFixed(2);
      const baseUrl = apiKey.startsWith("sk_sandbox_") ? "https://sandbox-api.bachs.io" : "https://api.bachs.io";
      // Recover an earlier uncertain attempt using its original reference and
      // idempotency key. Never mint a replacement operation just because a
      // previous network response was lost.
      const priorOrders = await auth.sql`SELECT id, provider_reference, idempotency_key, status, checkout_url, metadata
        FROM payment_orders WHERE campaign_id = ${campaign.id} AND user_id = ${auth.profile.id}
          AND provider = 'bachs' AND order_type = 'promotion' AND status IN ('created','pending')
        ORDER BY created_at DESC LIMIT 1`;
      let orderId;
      let reference;
      let idempotencyKey;
      if (priorOrders[0]) {
        const prior = priorOrders[0];
        if (prior.status === 'pending' && prior.checkout_url) {
          return res.status(200).json({ ok: true, checkoutUrl: prior.checkout_url, reused: true });
        }
        if (prior.status !== 'created' || !prior.provider_reference || !prior.idempotency_key) {
          return res.status(409).json({ ok: false, error: "An earlier checkout needs reconciliation before another attempt can be created." });
        }
        orderId = prior.id;
        reference = prior.provider_reference;
        idempotencyKey = prior.idempotency_key;
      } else {
        reference = "NCH-PROMO-" + randomUUID().replaceAll("-", "").toUpperCase();
        idempotencyKey = reference;
        // Reserve the campaign's single active checkout under a row lock.
        const reservation = await auth.sql.transaction([
          auth.sql`SELECT id FROM promotion_campaigns WHERE id = ${campaign.id} AND buyer_user_id = ${auth.profile.id} FOR UPDATE`,
          auth.sql`UPDATE promotion_campaigns SET payment_status = 'pending', payment_reference = ${reference}
            WHERE id = ${campaign.id} AND buyer_user_id = ${auth.profile.id}
              AND status = 'pending_payment' AND payment_status IN ('unpaid','failed')
            RETURNING id`,
          auth.sql`INSERT INTO payment_orders (user_id, campaign_id, order_type, provider, provider_reference, idempotency_key, amount_minor, currency, status, metadata)
            SELECT ${auth.profile.id}, ${campaign.id}, 'promotion', 'bachs', ${reference}, ${reference},
              ${campaign.budget_minor}, ${campaign.currency}, 'created',
              ${JSON.stringify({ campaign_id: campaign.id, package_title: campaign.title })}::jsonb
            WHERE EXISTS (SELECT 1 FROM promotion_campaigns WHERE id = ${campaign.id} AND payment_reference = ${reference})
            RETURNING id`
        ]);
        orderId = reservation[2]?.[0]?.id;
        if (!orderId) {
          const existing = await auth.sql`SELECT checkout_url FROM payment_orders
            WHERE campaign_id = ${campaign.id} AND user_id = ${auth.profile.id}
              AND provider = 'bachs' AND status = 'pending' AND checkout_url IS NOT NULL
            ORDER BY created_at DESC LIMIT 1`;
          if (existing[0]?.checkout_url) return res.status(200).json({ ok: true, checkoutUrl: existing[0].checkout_url, reused: true });
          return res.status(409).json({ ok: false, error: "A checkout is already being prepared for this campaign. Please wait and refresh your campaign status." });
        }
      }
      let checkoutResponse;
      try {
        checkoutResponse = await fetch(baseUrl + "/v1/checkout-sessions", {
          method: "POST",
          headers: { Authorization: "Bearer " + apiKey, "Content-Type": "application/json", "Idempotency-Key": idempotencyKey },
          body: JSON.stringify({
            pricing: { currency: campaign.currency, amount },
            ...(auth.profile.email ? { customer: { email: auth.profile.email, ...(auth.profile.display_name ? { name: auth.profile.display_name } : {}) } } : {}),
            reference,
            metadata: { campaign_id: campaign.id, payment_order_id: orderId, order_type: "promotion" },
            expires_in_minutes: 60
          })
        });
      } catch (networkError) {
        // The provider may have created the session even if our response was
        // lost. Keep the order in 'created' and retry with the same body/key.
        await auth.sql`UPDATE payment_orders SET metadata = metadata || ${JSON.stringify({ checkout_error: "Provider response was not received; outcome uncertain" })}::jsonb WHERE id = ${orderId} AND status = 'created'`;
        return res.status(502).json({ ok: false, retry: true, error: "Bachs did not return a response. You can safely retry this checkout; the same idempotency key will be reused." });
      }
      const checkout = await checkoutResponse.json().catch(() => ({}));
      let checkoutUrl = null;
      try {
        const parsedCheckoutUrl = new URL(String(checkout.checkout_url || ""));
        if (parsedCheckoutUrl.protocol === "https:" && !parsedCheckoutUrl.username && !parsedCheckoutUrl.password) checkoutUrl = parsedCheckoutUrl.toString();
      } catch { /* Invalid provider URL is rejected below. */ }
      const checkoutId = typeof checkout.checkout_id === "string" && checkout.checkout_id.length > 0 && checkout.checkout_id.length <= 200
        ? checkout.checkout_id
        : null;
      if (!checkoutResponse.ok && (checkoutResponse.status >= 500 || checkout.error_code === "IDEMPOTENCY_IN_PROGRESS")) {
        await auth.sql`UPDATE payment_orders SET metadata = metadata || ${JSON.stringify({ checkout_error: checkout.error_code || "Provider returned an uncertain response" })}::jsonb WHERE id = ${orderId} AND status = 'created'`;
        return res.status(502).json({ ok: false, retry: true, error: "Bachs has not confirmed the checkout result. Retry this same checkout shortly; Nochalant will reuse its original idempotency key." });
      }
      if (!checkoutResponse.ok || !checkoutUrl || !checkoutId) {
        await auth.sql.transaction([
          auth.sql`UPDATE payment_orders SET status = 'failed', metadata = metadata || ${JSON.stringify({ checkout_error: checkout.error || checkout.message || "Checkout creation failed" })}::jsonb WHERE id = ${orderId} AND status = 'created'`,
          auth.sql`UPDATE promotion_campaigns SET payment_status = 'failed' WHERE id = ${campaign.id} AND payment_reference = ${reference} AND payment_status = 'pending'`
        ]);
        return res.status(502).json({ ok: false, error: "Bachs rejected checkout creation. Please review the campaign and try again." });
      }
      const saved = await auth.sql`UPDATE payment_orders SET status = 'pending', checkout_url = ${checkoutUrl}, metadata = metadata || ${JSON.stringify({ checkout_id: checkoutId })}::jsonb WHERE id = ${orderId} AND status = 'created' RETURNING id`;
      if (!saved.length) return res.status(409).json({ ok: false, error: "Checkout could not be safely attached to its payment order. Please refresh before trying again." });
      return res.status(200).json({ ok: true, checkoutUrl, checkoutId });
    }
    if (action === "admin_queue") {
      if (auth.profile.role !== "super_admin") return res.status(403).json({ ok: false, error: "Administrator access required." });
      const rows = await auth.sql`SELECT id, buyer_user_id, title, package_code, media_kind, currency, budget_minor, status, payment_status, media_object_key, created_at FROM promotion_campaigns WHERE status IN ('pending_payment','pending_review') ORDER BY created_at ASC LIMIT 100`;
      const campaigns = await Promise.all(rows.map(async item => ({ ...item, media_url: item.media_object_key ? await createMusicDownloadUrl(item.media_object_key, 1800) : null })));
      return res.status(200).json({ ok: true, campaigns });
    }
    if (action === "moderate") {
      if (auth.profile.role !== "super_admin") return res.status(403).json({ ok: false, error: "Administrator access required." });
      const id = clean(req.body?.campaignId, 50);
      const decision = clean(req.body?.decision, 20);
      if (!/^[0-9a-f-]{36}$/i.test(id) || !["approve","reject"].includes(decision)) return res.status(400).json({ ok: false, error: "Choose a valid campaign and decision." });
      const packageRows = await auth.sql`SELECT package_code FROM promotion_campaigns WHERE id = ${id} LIMIT 1`;
      const durationDays = packages[packageRows[0]?.package_code]?.days;
      if (!durationDays) return res.status(404).json({ ok: false, error: "Campaign package was not found." });
      const rows = await auth.sql`UPDATE promotion_campaigns SET status = CASE WHEN ${decision} = 'approve' THEN 'approved' ELSE 'rejected' END, starts_at = CASE WHEN ${decision} = 'approve' THEN now() ELSE starts_at END, ends_at = CASE WHEN ${decision} = 'approve' THEN now() + (${durationDays} * interval '1 day') ELSE ends_at END, reviewed_by = ${auth.profile.id}, reviewed_at = now() WHERE id = ${id} AND payment_status = 'paid' AND status = 'pending_review' RETURNING id, status, starts_at, ends_at`;
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
