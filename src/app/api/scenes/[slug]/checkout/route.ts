import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(_request: Request, context: { params: Promise<{ slug: string }> }) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });

  const [user, scene] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, displayName: true, status: true, ageAssurance: { select: { declaredAdult: true } } },
    }),
    prisma.scene.findFirst({
      where: { slug: (await context.params).slug, active: true },
      select: { id: true, name: true, founderId: true, visibility: true, accessPriceKobo: true },
    }),
  ]);
  if (!user || user.status !== "ACTIVE") return NextResponse.json({ error: "Your account cannot make this purchase." }, { status: 403 });
  if (!user.ageAssurance?.declaredAdult) return NextResponse.json({ error: "Complete the 18+ age confirmation first." }, { status: 403 });
  if (!scene) return NextResponse.json({ error: "Scene not found." }, { status: 404 });
  if (scene.visibility !== "PAID" || !scene.accessPriceKobo || scene.accessPriceKobo <= 0n) {
    return NextResponse.json({ error: "This Scene is not configured for paid access." }, { status: 409 });
  }
  if (scene.founderId === userId) return NextResponse.json({ error: "You already own this Scene." }, { status: 409 });

  const blocked = await prisma.userBlock.findFirst({
    where: { OR: [{ sourceId: userId, targetId: scene.founderId }, { sourceId: scene.founderId, targetId: userId }] },
    select: { id: true },
  });
  if (blocked) return NextResponse.json({ error: "You cannot join this Scene." }, { status: 403 });

  const membership = await prisma.sceneMember.findUnique({
    where: { sceneId_userId: { sceneId: scene.id, userId } },
    select: { status: true },
  });
  if (membership?.status === "ACTIVE") return NextResponse.json({ error: "You are already a member." }, { status: 409 });

  const apiKey = process.env.BACHS_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "Scene checkout is temporarily unavailable." }, { status: 503 });

  const purpose = `SCENE_ACCESS:${scene.id}`;
  let payment = await prisma.paymentTransaction.findFirst({
    where: { userId, provider: "bachs", purpose, status: "PENDING" },
    orderBy: { createdAt: "desc" },
  });
  if (payment?.checkoutUrl) return NextResponse.json({ checkoutUrl: payment.checkoutUrl, reused: true });
  if (payment && Date.now() - payment.createdAt.getTime() >= 86400000) {
    return NextResponse.json({ error: "This earlier checkout needs payment reconciliation before a new attempt can be created. Contact support; do not pay again." }, { status: 409 });
  }

  if (!payment) {
    const reference = "NCH-SCENE-" + randomUUID().replaceAll("-", "").toUpperCase();
    payment = await prisma.paymentTransaction.create({
      data: {
        userId, provider: "bachs", reference, amountKobo: scene.accessPriceKobo, currency: "NGN",
        status: "PENDING", purpose, idempotencyKey: reference,
        metadata: { sceneId: scene.id, sceneName: scene.name, founderId: scene.founderId, checkoutVersion: 1 },
      },
    });
  }

  const checkoutRequest = {
    pricing: { currency: "NGN", amount: (Number(payment.amountKobo) / 100).toFixed(2) },
    ...(user.email ? { customer: { email: user.email, name: user.displayName } } : {}),
    reference: payment.reference,
    metadata: { payment_transaction_id: payment.id, scene_id: scene.id, order_type: "scene_access" },
    expires_in_minutes: 60,
  };
  const baseUrl = apiKey.startsWith("sk_sandbox_") ? "https://sandbox-api.bachs.io" : "https://api.bachs.io";
  let providerResponse: Response;
  try {
    providerResponse = await fetch(baseUrl + "/v1/checkout-sessions", {
      method: "POST",
      headers: { Authorization: "Bearer " + apiKey, "Content-Type": "application/json", "Idempotency-Key": payment.idempotencyKey || payment.reference },
      body: JSON.stringify(checkoutRequest),
    });
  } catch {
    return NextResponse.json({ error: "Bachs did not confirm the checkout result. Retry safely; the original payment reference will be reused." }, { status: 502 });
  }
  const checkout = await providerResponse.json().catch(() => ({})) as { checkout_url?: unknown; checkout_id?: unknown; error?: unknown; message?: unknown };
  let checkoutUrl: string | null = null;
  try {
    const parsed = new URL(String(checkout.checkout_url || ""));
    if (parsed.protocol === "https:" && !parsed.username && !parsed.password) checkoutUrl = parsed.toString();
  } catch { /* reject malformed checkout URL */ }
  const checkoutId = typeof checkout.checkout_id === "string" && checkout.checkout_id.length > 0 && checkout.checkout_id.length <= 200 ? checkout.checkout_id : null;
  if (!providerResponse.ok || !checkoutUrl || !checkoutId) {
    if (providerResponse.status >= 500 || checkout.error === "IDEMPOTENCY_IN_PROGRESS") {
      return NextResponse.json({ error: "Bachs is still preparing checkout. Retry shortly; the same idempotency key will be reused." }, { status: 502 });
    }
    return NextResponse.json({ error: "Bachs could not create this checkout. Please try again." }, { status: 502 });
  }

  const saved = await prisma.paymentTransaction.updateMany({
    where: { id: payment.id, status: "PENDING", providerCheckoutId: null },
    data: { providerCheckoutId: checkoutId, checkoutUrl },
  });
  if (!saved.count) {
    const latest = await prisma.paymentTransaction.findUnique({ where: { id: payment.id }, select: { checkoutUrl: true } });
    if (!latest?.checkoutUrl) return NextResponse.json({ error: "Checkout could not be attached to its payment record. Contact support before retrying." }, { status: 409 });
    checkoutUrl = latest.checkoutUrl;
  }
  return NextResponse.json({ checkoutUrl });
}
