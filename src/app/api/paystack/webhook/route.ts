import { createHmac } from "node:crypto";
import { markPaymentPaid } from "@/lib/payments";

export async function POST(request: Request) {
  const raw = await request.text();
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) return new Response("test mode", { status: 200 });
  const signature = request.headers.get("x-paystack-signature");
  const hash = createHmac("sha512", secret).update(raw).digest("hex");
  if (hash !== signature) return new Response("invalid signature", { status: 401 });
  const event = JSON.parse(raw) as { event?: string; data?: { reference?: string } };
  if (event.event === "charge.success" && event.data?.reference) {
    await markPaymentPaid(event.data.reference);
  }
  return new Response("ok");
}
