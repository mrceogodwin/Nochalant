import { getDb, type Row } from "./db";
import { planById } from "./catalog";

export async function markPaymentPaid(reference: string) {
  const db = getDb();
  const rows = (await db`
    UPDATE social.payments
    SET status = 'paid'
    WHERE reference = ${reference} AND status <> 'paid'
    RETURNING user_id, purpose, plan, amount_naira
  `) as Row[];
  const payment = rows[0];
  if (!payment) return false;
  const userId = String(payment.user_id);
  const amount = Number(payment.amount_naira);
  if (payment.purpose === "pro") {
    const plan = String(payment.plan ?? "monthly");
    const days = plan === "yearly" ? 365 : plan === "quarterly" ? 90 : 30;
    await db`
      UPDATE social.users
      SET is_pro = true, pro_plan = ${plan}, pro_renews_at = now() + make_interval(days => ${days})
      WHERE id = ${userId}
    `;
    const known = planById(plan);
    await db`
      INSERT INTO social.transactions (user_id, kind, amount_naira, title, detail)
      VALUES (${userId}, 'pro', ${-amount}, 'Nochalant Club', ${known ? known.name : plan})
    `;
  }
  if (payment.purpose === "wallet") {
    await db`UPDATE social.users SET wallet_naira = wallet_naira + ${amount} WHERE id = ${userId}`;
    await db`
      INSERT INTO social.transactions (user_id, kind, amount_naira, title, detail)
      VALUES (${userId}, 'deposit', ${amount}, 'Added funds', 'Wallet top up')
    `;
  }
  return true;
}

export async function verifyPaystack(reference: string) {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) return null;
  const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
    headers: { Authorization: `Bearer ${key}` },
    cache: "no-store",
  });
  if (!response.ok) return null;
  const json = (await response.json()) as { data?: { status?: string } };
  return json.data?.status === "success";
}
