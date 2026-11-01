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
  const amount = Number(data?.amount);
  const amountMinor = Math.round(amount * 100);
  const currency = typeof data?.currency === "string" ? data.currency.trim().toUpperCase() : "";
  const expectedCurrency = String(order?.currency ?? "").trim().toUpperCase();
  return Number.isFinite(amount) &&
    Number.isSafeInteger(amountMinor) &&
    amountMinor > 0 &&
    amountMinor === Number(order?.amount_minor) &&
    currency !== "" &&
    currency === expectedCurrency &&
    typeof data?.status === "string" &&
    data.status.trim().toUpperCase() === "SUCCEEDED";
}
