import { bachsApiBase } from "./provider";
import { nairaDecimal } from "./signature";

type BachsError = Error & { status?: number };

const PLANS = [
  { id: "monthly", name: "Nochalant Club Monthly", amount: "2999.00", interval: "month", frequency: 1 },
  { id: "quarterly", name: "Nochalant Club Quarterly", amount: "7999.00", interval: "month", frequency: 3 },
  { id: "yearly", name: "Nochalant Club Yearly", amount: "26999.00", interval: "year", frequency: 1 },
] as const;

function key() {
  const value = process.env.BACHS_API_KEY;
  if (!value) throw new Error("BACHS_API_KEY is not set");
  return value;
}

async function bachs(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${key()}`);
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  const response = await fetch(`${bachsApiBase()}${path}`, { ...init, headers, cache: "no-store" });
  const text = await response.text();
  const json = text ? (JSON.parse(text) as Record<string, unknown>) : {};
  if (!response.ok) {
    const error = new Error(String(json.detail || response.statusText || "Bachs request failed")) as BachsError;
    error.status = response.status;
    throw error;
  }
  return json;
}

function itemsOf(payload: Record<string, unknown>) {
  if (Array.isArray(payload.items)) return payload.items as Record<string, unknown>[];
  if (Array.isArray(payload.data)) return payload.data as Record<string, unknown>[];
  return [];
}

export async function ensureProProduct(planId: string) {
  const plan = PLANS.find((item) => item.id === planId);
  if (!plan) throw new Error("Unknown plan");
  const envName = `BACHS_PRODUCT_PRO_${plan.id.toUpperCase()}`;
  const preset = process.env[envName];
  if (preset) return preset;
  const listed = await bachs("/v1/products");
  const existing = itemsOf(listed).find((item) => {
    const metadata = item.metadata as Record<string, unknown> | undefined;
    return metadata?.nochalant_plan === plan.id || item.name === plan.name;
  });
  if (existing?.id) return String(existing.id);
  const created = await bachs("/v1/products", {
    method: "POST",
    headers: { "Idempotency-Key": `nochalant-pro-${plan.id}` },
    body: JSON.stringify({
      name: plan.name,
      description: `Nochalant Club Pro, ${plan.id}.`,
      price: { price_type: "fixed", currency: "NGN", amount: plan.amount },
      billing_cycle: { interval: plan.interval, frequency: plan.frequency },
      metadata: { nochalant_plan: plan.id },
    }),
  });
  return String(created.id);
}

export async function createBachsCheckout(input: {
  reference: string;
  email: string;
  name: string;
  purpose: "pro" | "wallet" | "gift";
  amountNaira: number;
  planId?: string;
  successPath: string;
  cancelPath: string;
  metadata?: Record<string, string>;
}) {
  const origin = (process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/$/, "");
  if (!origin || /localhost|127\.0\.0\.1/.test(origin)) {
    throw new Error("Bachs refuses localhost success URLs. Set NEXT_PUBLIC_APP_URL to a public https origin.");
  }
  const metadata = {
    purpose: input.purpose,
    user_id: input.metadata?.user_id || "",
    plan: input.planId || "",
    ...input.metadata,
  };
  const body: Record<string, unknown> = {
    customer: { email: input.email, name: input.name },
    reference: input.reference,
    metadata,
    success_url: `${origin}${input.successPath}`,
    cancel_url: `${origin}${input.cancelPath}`,
  };
  if (input.purpose === "pro" && input.planId) {
    body.product_cart = [{ product_id: await ensureProProduct(input.planId), quantity: 1 }];
    body.billing_currency = "NGN";
  } else {
    body.pricing = { currency: "NGN", amount: nairaDecimal(input.amountNaira) };
    body.payment_method_types = ["NGN_CARD", "NGN_BANK_TRANSFER"];
  }
  const checkout = await bachs("/v1/checkout-sessions", {
    method: "POST",
    headers: { "Idempotency-Key": input.reference },
    body: JSON.stringify(body),
  });
  const url = String(checkout.checkout_url || "");
  if (!url) throw new Error("Bachs did not return a checkout URL");
  return { url, checkoutId: String(checkout.checkout_id || checkout.id || "") };
}

function bankCode(banks: { name?: string; code?: string }[], bankName: string) {
  const wanted = bankName.toLowerCase().replace(/bank/g, "").replace(/[^a-z0-9]/g, "");
  const aliases: Record<string, string> = { gtb: "058", gtbank: "058", guarantytrust: "058", access: "044", uba: "033", zenith: "057", firstbank: "011", opay: "100004" };
  if (aliases[wanted]) return aliases[wanted];
  const match = banks.find((bank) => {
    const name = String(bank.name || "").toLowerCase().replace(/bank/g, "").replace(/[^a-z0-9]/g, "");
    return name && (name.includes(wanted) || wanted.includes(name));
  });
  return match?.code || "";
}

export async function payoutToNigerianBank(input: {
  reference: string;
  email: string;
  displayName: string;
  amountNaira: number;
  bankName: string;
  accountNumber: string;
  existingAccountId?: string | null;
}) {
  const listed = await bachs("/v1/reference/banks?country=NG");
  const banks = (Array.isArray(listed.banks) ? listed.banks : []) as { name?: string; code?: string }[];
  const code = bankCode(banks, input.bankName);
  if (!code) throw new Error(`Bachs has no Nigerian bank matching “${input.bankName}”. Use the name from its bank list, such as Guaranty Trust Bank.`);
  let accountId = input.existingAccountId || "";
  if (!accountId) {
    const account = await bachs("/v1/accounts", {
      method: "POST",
      headers: { "Idempotency-Key": `nochalant-acct-${input.email}` },
      body: JSON.stringify({
        contact_email: input.email,
        display_name: input.displayName,
        country: "NG",
        entity_type: "individual",
        configuration: {
          recipient: { capabilities: { transfers: { requested: true }, payouts: { requested: true } } },
        },
      }),
    });
    accountId = String(account.id);
    const [first, ...rest] = input.displayName.split(/\s+/);
    await bachs(`/v1/accounts/${accountId}`, {
      method: "POST",
      body: JSON.stringify({
        fields: {
          persons: [
            {
              first_name: first || "Member",
              last_name: rest.join(" ") || "Nochalant",
              email: input.email,
              relationship: { representative: true },
            },
          ],
        },
      }),
    });
  }
  const destination = await bachs("/v1/payouts/destinations", {
    method: "POST",
    headers: { "X-Account-Id": accountId, "Idempotency-Key": `${input.reference}-dest` },
    body: JSON.stringify({
      type: "bank_account",
      currency: "NGN",
      bank_code: code,
      account_number: input.accountNumber,
    }),
  });
  const destinationId = String(destination.id);
  await bachs("/v1/transfers", {
    method: "POST",
    headers: { "Idempotency-Key": `${input.reference}-transfer` },
    body: JSON.stringify({
      destination: accountId,
      amount: nairaDecimal(input.amountNaira),
      currency: "NGN",
      description: "Nochalant withdrawal",
    }),
  });
  await bachs("/v1/payouts", {
    method: "POST",
    headers: { "X-Account-Id": accountId, "Idempotency-Key": `${input.reference}-payout` },
    body: JSON.stringify({
      destination: destinationId,
      amount: nairaDecimal(input.amountNaira),
      reference: input.reference,
      narration: "Nochalant",
    }),
  });
  return { accountId, destinationId };
}
