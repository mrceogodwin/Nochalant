export type PaymentProviderName = "bachs" | "paystack" | "test";

export function bachsConfigured() {
  return Boolean(process.env.BACHS_API_KEY?.startsWith("sk_"));
}

export function paystackConfigured() {
  return Boolean(process.env.PAYSTACK_SECRET_KEY);
}

/** Bachs is the default. Paystack stays available behind PAYMENT_PROVIDER=paystack. No keys means test mode. */
export function activeProvider(): PaymentProviderName {
  const choice = (process.env.PAYMENT_PROVIDER || "bachs").toLowerCase();
  if (choice === "paystack") return paystackConfigured() ? "paystack" : "test";
  if (choice === "bachs") return bachsConfigured() ? "bachs" : "test";
  return "test";
}

export function paymentBrand() {
  return activeProvider() === "paystack" ? "Paystack" : "Bachs";
}

export function bachsApiBase() {
  if (process.env.BACHS_API_BASE) return process.env.BACHS_API_BASE.replace(/\/$/, "");
  return process.env.BACHS_API_KEY?.startsWith("sk_live_") ? "https://api.bachs.io" : "https://sandbox-api.bachs.io";
}

export function appOrigin() {
  return (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
}
