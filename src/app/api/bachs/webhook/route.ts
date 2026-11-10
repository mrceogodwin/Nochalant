import { getDb, type Row } from "@/lib/db";
import { markPaymentPaid } from "@/lib/payments";
import { verifyBachsSignature } from "@/lib/payments/signature";

type Collection = {
  id?: string;
  type?: string;
  data?: {
    reference?: string | null;
    checkout_id?: string | null;
    status?: string;
    amount?: string;
    currency?: string;
    metadata?: Record<string, string>;
  };
};

function secrets() {
  return [process.env.BACHS_WEBHOOK_SECRET, process.env.BACHS_WEBHOOK_SECRET_PREVIOUS].filter(
    (value): value is string => Boolean(value),
  );
}

export async function POST(request: Request) {
  const raw = await request.text();
  if (!verifyBachsSignature(raw, request.headers, secrets())) {
    return new Response("Invalid signature", { status: 400 });
  }
  let event: Collection;
  try {
    event = JSON.parse(raw) as Collection;
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }
  if (event.type !== "collection.succeeded") return new Response("ignored");
  const status = event.data?.status;
  if (status && !["SUCCEEDED", "ACCEPTED", "OVERPAID"].includes(status)) return new Response("ignored");
  if (event.data?.currency && event.data.currency !== "NGN") return new Response("ignored");
  const reference = event.data?.reference;
  if (!reference || !event.id) return new Response("ok");
  const db = getDb();
  const seen = (await db`
    INSERT INTO social.payment_events (event_id, reference)
    VALUES (${event.id}, ${reference})
    ON CONFLICT DO NOTHING
    RETURNING event_id
  `) as Row[];
  if (!seen.length) return new Response("duplicate");
  const payments = (await db`
    SELECT amount_naira, status FROM social.payments WHERE reference = ${reference} LIMIT 1
  `) as Row[];
  const payment = payments[0];
  if (!payment) return new Response("unknown reference", { status: 200 });
  const expected = Number(payment.amount_naira).toFixed(2);
  if (event.data?.amount && event.data.amount !== expected) {
    return new Response("amount mismatch", { status: 200 });
  }
  if (payment.status !== "paid") await markPaymentPaid(reference);
  return new Response("ok");
}
