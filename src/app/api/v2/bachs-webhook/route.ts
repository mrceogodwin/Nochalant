import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isValidBachsEventEnvelope, matchesBachsSuccessfulPayment } from "../../../../../api/_lib/bachs-webhook-validation.js";

export const runtime = "nodejs";

function verifySignature(raw: string, headers: Headers, secret: string) {
  const v2 = headers.get("x-bachs-signature-v2");
  const timestampHeader = headers.get("x-bachs-timestamp");
  const legacySignature = headers.get("x-bachs-signature");
  let timestamp = timestampHeader;
  let signatures = legacySignature ? [legacySignature] : [];
  if (v2) {
    const parts = v2.split(",").map(part => part.trim());
    timestamp = parts.find(part => part.startsWith("t="))?.slice(2) || timestamp;
    signatures = parts.filter(part => part.startsWith("v1=")).map(part => part.slice(3));
  }
  if (!timestamp || !/^\d+$/.test(timestamp) || Math.abs(Date.now() / 1000 - Number(timestamp)) > 300 || !signatures.length) return false;
  const expected = createHmac("sha256", secret).update(timestamp + ".").update(raw).digest("hex");
  return signatures.some(signature => {
    if (!/^[a-f0-9]{64}$/i.test(signature)) return false;
    const a = Buffer.from(expected, "hex");
    const b = Buffer.from(signature, "hex");
    return a.length === b.length && timingSafeEqual(a, b);
  });
}

export async function POST(request: Request) {
  const secret = process.env.BACHS_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "Webhook is not configured." }, { status: 503 });
  const raw = await request.text();
  if (raw.length > 1024 * 1024) return NextResponse.json({ error: "Payload too large." }, { status: 413 });
  if (!verifySignature(raw, request.headers, secret)) return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400 });

  let event: unknown;
  try { event = JSON.parse(raw); } catch { return NextResponse.json({ error: "Invalid JSON." }, { status: 400 }); }
  if (!isValidBachsEventEnvelope(event)) return NextResponse.json({ error: "Invalid event envelope." }, { status: 400 });

  const payloadHash = createHash("sha256").update(raw).digest("hex");
  try {
    await prisma.paymentWebhookEvent.create({
      data: {
        provider: "bachs", eventId: String(event.id), signatureValid: true, payloadHash,
      },
    });
  } catch (error) {
    const existing = await prisma.paymentWebhookEvent.findUnique({
      where: { provider_eventId: { provider: "bachs", eventId: String(event.id) } },
      select: { payloadHash: true },
    });
    if (existing) {
      if (existing.payloadHash !== payloadHash) return NextResponse.json({ error: "Conflicting webhook event payload." }, { status: 409 });
      return NextResponse.json({ received: true, duplicate: true });
    }
    throw error;
  }

  try {
    const checkoutId = typeof event.data?.checkout_id === "string" ? event.data.checkout_id : "";
    if (!checkoutId || checkoutId.length > 200) {
      await prisma.paymentWebhookEvent.update({ where: { provider_eventId: { provider: "bachs", eventId: String(event.id) } }, data: { processedAt: new Date() } });
      return NextResponse.json({ error: "Missing checkout ID." }, { status: 400 });
    }
    const payment = await prisma.paymentTransaction.findFirst({
      where: { provider: "bachs", providerCheckoutId: checkoutId, purpose: { startsWith: "SCENE_ACCESS:" } },
    });
    if (!payment) {
      await prisma.paymentWebhookEvent.delete({ where: { provider_eventId: { provider: "bachs", eventId: String(event.id) } } });
      return NextResponse.json({ received: false, retry: true, error: "Payment mapping is not available yet." }, { status: 503 });
    }

    if (event.type === "collection.succeeded") {
      const matches = matchesBachsSuccessfulPayment(event.data, {
        amount_minor: Number(payment.amountKobo),
        currency: payment.currency,
      });
      if (!matches) {
        await prisma.paymentWebhookEvent.update({ where: { provider_eventId: { provider: "bachs", eventId: String(event.id) } }, data: { processedAt: new Date() } });
        return NextResponse.json({ error: "Payment amount, currency or status mismatch." }, { status: 400 });
      }
      const sceneId = payment.purpose.slice("SCENE_ACCESS:".length);
      await prisma.$transaction(async tx => {
        const current = await tx.paymentTransaction.findUnique({ where: { id: payment.id }, select: { status: true } });
        if (current?.status !== "SUCCESSFUL") {
          await tx.paymentTransaction.update({
            where: { id: payment.id },
            data: { status: "SUCCESSFUL", verifiedAt: new Date(), metadata: { ...(payment.metadata as Record<string, unknown> || {}), bachsEventId: String(event.id), chargeId: typeof event.data?.charge_id === "string" ? event.data.charge_id : null } },
          });
          await tx.sceneMember.upsert({
            where: { sceneId_userId: { sceneId, userId: payment.userId } },
            create: { sceneId, userId: payment.userId, status: "ACTIVE", role: "MEMBER" },
            update: { status: "ACTIVE", role: "MEMBER", joinedAt: new Date() },
          });
        }
        await tx.paymentWebhookEvent.update({
          where: { provider_eventId: { provider: "bachs", eventId: String(event.id) } },
          data: { transactionId: payment.id, processedAt: new Date() },
        });
      });
      return NextResponse.json({ received: true, paid: true });
    }

    if (["collection.failed", "collection.underpaid", "checkout.expired"].includes(event.type)) {
      await prisma.$transaction([
        prisma.paymentTransaction.updateMany({ where: { id: payment.id, status: "PENDING" }, data: { status: "FAILED" } }),
        prisma.paymentWebhookEvent.update({ where: { provider_eventId: { provider: "bachs", eventId: String(event.id) } }, data: { transactionId: payment.id, processedAt: new Date() } }),
      ]);
      return NextResponse.json({ received: true, failed: true });
    }

    await prisma.paymentWebhookEvent.update({
      where: { provider_eventId: { provider: "bachs", eventId: String(event.id) } },
      data: { processedAt: new Date() },
    });
    return NextResponse.json({ received: true, ignored: true });
  } catch (error) {
    await prisma.paymentWebhookEvent.deleteMany({
      where: { provider: "bachs", eventId: String(event.id), processedAt: null },
    }).catch(() => undefined);
    console.error("V2 Bachs webhook reconciliation failed:", error);
    return NextResponse.json({ error: "Webhook processing failed; provider retry is required." }, { status: 500 });
  }
}
