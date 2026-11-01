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
