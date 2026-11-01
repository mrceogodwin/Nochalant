export function isValidBachsEventEnvelope(event) {
  return Boolean(
    event &&
    typeof event === "object" &&
    !Array.isArray(event) &&
    typeof event.id === "string" &&
    event.id.trim() &&
    event.id.length <= 200 &&
    typeof event.type === "string" &&
    event.type.trim() &&
    event.type.length <= 120 &&
    event.data &&
    typeof event.data === "object" &&
    !Array.isArray(event.data)
  );
}

export function getBachsCheckoutId(data) {
  if (typeof data?.checkout_id !== "string") return "";
  const checkoutId = data.checkout_id.trim();
  return checkoutId.length > 0 && checkoutId.length <= 200 ? checkoutId : "";
}

export function matchesBachsSuccessfulPayment(data, order) {
  const amountText = typeof data?.amount === "number" || typeof data?.amount === "string"
    ? String(data.amount).trim()
    : "";
  const amountMatch = /^(0|[1-9]\d*)(?:\.(\d{1,2}))?$/.exec(amountText);
  const amountMinor = amountMatch
    ? Number(amountMatch[1]) * 100 + Number((amountMatch[2] || "").padEnd(2, "0"))
    : NaN;
  const expectedMinor = Number(order?.amount_minor);
  const currency = typeof data?.currency === "string" ? data.currency.trim().toUpperCase() : "";
  const expectedCurrency = String(order?.currency ?? "").trim().toUpperCase();
  return Number.isSafeInteger(amountMinor) &&
    amountMinor > 0 &&
    Number.isSafeInteger(expectedMinor) &&
    amountMinor === expectedMinor &&
    currency !== "" &&
    currency === expectedCurrency &&
    typeof data?.status === "string" &&
    data.status.trim().toUpperCase() === "SUCCEEDED";
}

// Bachs caches successful idempotent responses for 24 hours. Reconcile older
// uncertain attempts before retrying so a duplicate checkout is not created.
export function isWithinBachsIdempotencyWindow(createdAt, now = Date.now()) {
  const createdMs = new Date(createdAt).getTime();
  const nowMs = now instanceof Date ? now.getTime() : Number(now);
  const ageMs = nowMs - createdMs;
  return Number.isFinite(createdMs) && Number.isFinite(nowMs) && ageMs >= 0 && ageMs < 86400000;
}

export function parseBachsRefundEvent(event) {
  if (!event || !["refund.created", "refund.paid", "refund.failed"].includes(event.type) ||
      !event.data || typeof event.data !== "object" || Array.isArray(event.data)) return null;
  const data = event.data;
  const reference = typeof data.reference === "string" ? data.reference.trim() : "";
  const refundId = typeof data.refund_id === "string" ? data.refund_id.trim() : "";
  const chargeId = typeof data.charge_id === "string" ? data.charge_id.trim() : "";
  const amountValue = event.type === "refund.paid" ? data.refunded_amount : data.requested_amount;
  const amountText = typeof amountValue === "string" ? amountValue.trim() : "";
  const match = /^(0|[1-9][0-9]*)(?:\.([0-9]{1,2}))?$/.exec(amountText);
  const amountMinor = match ? Number(match[1]) * 100 + Number((match[2] || "").padEnd(2, "0")) : NaN;
  if (!reference || reference.length > 128 || !refundId || refundId.length > 200 ||
      !chargeId || chargeId.length > 200 || !Number.isSafeInteger(amountMinor) || amountMinor <= 0) return null;
  return {
    reference, refundId, chargeId, amountMinor,
    status: event.type === "refund.paid" ? "successful" : event.type === "refund.failed" ? "failed" : "pending"
  };
}
