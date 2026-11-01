import { createHmac, timingSafeEqual } from "node:crypto";
import { neon } from "@neondatabase/serverless";
import { isValidBachsEventEnvelope, getBachsCheckoutId, matchesBachsSuccessfulPayment } from "./_lib/bachs-webhook-validation.js";

export const config = { api: { bodyParser: false } };

async function readRawBody(req) {
  const chunks = [];
  let total = 0;
  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    total += buffer.length;
    if (total > 1024 * 1024) throw new Error("Webhook payload is too large.");
    chunks.push(buffer);
  }
  return Buffer.concat(chunks);
}

function verifySignature(rawBody, headers, secret) {
  const v2 = headers["x-bachs-signature-v2"];
  const timestampHeader = headers["x-bachs-timestamp"];
  const legacySignature = headers["x-bachs-signature"];
  let timestamp = timestampHeader;
  let signatures = legacySignature ? [legacySignature] : [];
  if (typeof v2 === "string") {
    const parts = v2.split(",").map(part => part.trim());
    timestamp = parts.find(part => part.startsWith("t="))?.slice(2) || timestamp;
    signatures = parts.filter(part => part.startsWith("v1=")).map(part => part.slice(3));
  }
  if (!timestamp || !/^\d+$/.test(timestamp) || Math.abs(Date.now() / 1000 - Number(timestamp)) > 300 || !signatures.length) return false;
  const expected = createHmac("sha256", secret).update(timestamp + "." ).update(rawBody).digest("hex");
  return signatures.some(signature => {
    if (!/^[a-f0-9]{64}$/i.test(signature)) return false;
    const a = Buffer.from(expected, "hex");
    const b = Buffer.from(signature, "hex");
    return a.length === b.length && timingSafeEqual(a, b);
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).send("Method not allowed");
  }
  const secret = process.env.BACHS_WEBHOOK_SECRET;
  const databaseUrl = process.env.DATABASE_URL_POOLED || process.env.DATABASE_URL;
  if (!secret || !databaseUrl) return res.status(503).send("Webhook is not configured");
  let eventId = null;
  try {
    const rawBody = await readRawBody(req);
    if (!verifySignature(rawBody, req.headers, secret)) return res.status(400).send("Invalid webhook signature");
    let event;
    try {
      event = JSON.parse(rawBody.toString("utf8"));
    } catch {
      return res.status(400).send("Invalid webhook JSON");
    }
    if (!isValidBachsEventEnvelope(event)) return res.status(400).send("Invalid event envelope");
    eventId = String(event.id);
    const sql = neon(databaseUrl);
    const inserted = await sql`
      INSERT INTO payment_webhook_events (provider, provider_event_id, event_type, signature_verified, payload, processing_status)
      VALUES ('bachs', ${String(event.id)}, ${String(event.type)}, true, ${JSON.stringify(event)}::jsonb, 'received')
      ON CONFLICT (provider, provider_event_id) DO NOTHING
      RETURNING id
    `;
    // Atomically claim this event so concurrent duplicate deliveries cannot
    // process the same payment transition at the same time. A stale claim is
    // recoverable after five minutes if a serverless invocation was interrupted.
    const claimed = await sql`
      UPDATE payment_webhook_events
      SET processing_status = 'processing', received_at = now(), error_message = NULL
      WHERE provider = 'bachs' AND provider_event_id = ${String(event.id)}
        AND (
          processing_status IN ('received','failed')
          OR (processing_status = 'processing' AND received_at < now() - interval '5 minutes')
        )
      RETURNING id
    `;
    if (!claimed.length) {
      const existing = await sql`SELECT processing_status FROM payment_webhook_events WHERE provider = 'bachs' AND provider_event_id = ${String(event.id)} LIMIT 1`;
      return res.status(200).json({
        received: true,
        duplicate: existing[0]?.processing_status === "processed" || existing[0]?.processing_status === "ignored",
        inProgress: existing[0]?.processing_status === "processing"
      });
    }

    if (event.type === "collection.succeeded") {
      const checkoutId = getBachsCheckoutId(event.data);
      if (!checkoutId || checkoutId.length > 200) {
        await sql`UPDATE payment_webhook_events SET processing_status = 'failed', error_message = 'Missing checkout_id' WHERE provider = 'bachs' AND provider_event_id = ${String(event.id)}`;
        return res.status(400).send("Missing checkout ID");
      }
      const orders = await sql`SELECT id, campaign_id, amount_minor, currency, metadata, provider_reference FROM payment_orders WHERE provider = 'bachs' AND metadata->>'checkout_id' = ${checkoutId} AND order_type = 'promotion' LIMIT 1`;
      const order = orders[0];
      if (!order) {
        // Checkout creation and webhook delivery can race: the provider may notify
        // us before checkout_id has been persisted on the order. Keep the event
        // retryable instead of permanently acknowledging it as an unknown payment.
        await sql`UPDATE payment_webhook_events SET processing_status = 'received', error_message = 'Checkout order mapping not available yet; awaiting provider retry' WHERE provider = 'bachs' AND provider_event_id = ${String(event.id)} AND processing_status = 'processing'`;
        return res.status(503).json({ received: false, retry: true });
      }
      if (!matchesBachsSuccessfulPayment(event.data, order)) {
        await sql`UPDATE payment_webhook_events SET processing_status = 'failed', processed_at = now(), error_message = 'Payment amount, currency or status mismatch' WHERE provider = 'bachs' AND provider_event_id = ${String(event.id)}`;
        return res.status(400).send("Payment details did not match the order");
      }
      await sql.transaction([
        sql`SELECT id FROM payment_orders WHERE id = ${order.id} AND status IN ('created','pending','failed') FOR UPDATE`,
        sql`UPDATE payment_orders SET status = 'successful', paid_at = COALESCE(paid_at, now()), metadata = metadata || ${JSON.stringify({ bachs_event_id: event.id, charge_id: event.data.charge_id || null })}::jsonb WHERE id = ${order.id} AND status IN ('created','pending','failed') RETURNING id`,
        sql`UPDATE promotion_campaigns SET payment_status = 'paid', status = 'pending_review' WHERE id = ${order.campaign_id} AND status = 'pending_payment' AND payment_status IN ('pending','failed') AND payment_reference = ${order.provider_reference} RETURNING id`,
      ]);
      const currentOrder = await sql`SELECT status FROM payment_orders WHERE id = ${order.id} LIMIT 1`;
      const currentCampaign = await sql`SELECT payment_status FROM promotion_campaigns WHERE id = ${order.campaign_id} LIMIT 1`;
      if (currentOrder[0]?.status !== 'successful' || currentCampaign[0]?.payment_status !== 'paid') {
        await sql`UPDATE payment_webhook_events SET error_message = 'Payment order or campaign could not be fully reconciled; awaiting retry' WHERE provider = 'bachs' AND provider_event_id = ${String(event.id)} AND processing_status <> 'processed'`;
        return res.status(409).json({ received: false, error: "Payment could not be fully reconciled. Provider retry is required." });
      }
      await sql`UPDATE payment_webhook_events SET processing_status = 'processed', processed_at = now(), error_message = NULL WHERE provider = 'bachs' AND provider_event_id = ${String(event.id)}`;
      return res.status(200).json({ received: true, paid: true });
    }

    if (event.type === "collection.failed" || event.type === "collection.underpaid" || event.type === "checkout.expired") {
      const checkoutId = String(event.data.checkout_id || "");
      if (!checkoutId) {
        await sql`UPDATE payment_webhook_events SET processing_status = 'failed', processed_at = now(), error_message = 'Missing checkout_id' WHERE provider = 'bachs' AND provider_event_id = ${String(event.id)}`;
        return res.status(400).send("Missing checkout ID");
      }
      const orders = await sql`SELECT id, campaign_id, provider_reference FROM payment_orders WHERE provider = 'bachs' AND metadata->>'checkout_id' = ${checkoutId} AND order_type = 'promotion' LIMIT 1`;
      if (!orders.length) {
        await sql`UPDATE payment_webhook_events SET error_message = 'Checkout order mapping not available yet; awaiting provider retry' WHERE provider = 'bachs' AND provider_event_id = ${String(event.id)} AND processing_status <> 'processed'`;
        return res.status(503).json({ received: false, retry: true });
      }
      await sql.transaction([
        sql`UPDATE payment_orders SET status = 'failed', metadata = metadata || ${JSON.stringify({ last_bachs_event: event.type })}::jsonb WHERE id = ${orders[0].id} AND status IN ('created','pending')`,
        sql`UPDATE promotion_campaigns SET payment_status = 'failed', status = 'pending_payment' WHERE id = ${orders[0].campaign_id} AND payment_status = 'pending' AND payment_reference = ${orders[0].provider_reference}`
      ]);
    }
    const supportedEvent = event.type === "collection.failed" || event.type === "collection.underpaid" || event.type === "checkout.expired";
    if (!supportedEvent) {
      await sql`UPDATE payment_webhook_events SET processing_status = 'ignored', processed_at = now(), error_message = 'Unsupported event type' WHERE provider = 'bachs' AND provider_event_id = ${String(event.id)}`;
      return res.status(200).json({ received: true, ignored: true });
    }
    await sql`UPDATE payment_webhook_events SET processing_status = 'processed', processed_at = now(), error_message = NULL WHERE provider = 'bachs' AND provider_event_id = ${String(event.id)}`;
    return res.status(200).json({ received: true });
  } catch (error) {
    console.error("Bachs promotion webhook failed:", error?.message || error);
    try {
      const sql = neon(databaseUrl);
      await sql`UPDATE payment_webhook_events
        SET processing_status = 'received', error_message = 'Webhook processing interrupted; awaiting provider retry'
        WHERE provider = 'bachs' AND provider_event_id = ${eventId}
          AND processing_status = 'processing'`;
    } catch (releaseError) {
      console.error("Bachs webhook claim release failed:", releaseError?.message || releaseError);
    }
    return res.status(500).send("Webhook processing failed");
  }
}
