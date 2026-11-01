import test from "node:test";
import assert from "node:assert/strict";
import {
  isValidBachsEventEnvelope,
  getBachsCheckoutId,
  matchesBachsSuccessfulPayment,
  isWithinBachsIdempotencyWindow,
  parseBachsRefundEvent
} from "../api/_lib/bachs-webhook-validation.js";

test("accepts a well-formed Bachs event envelope", () => {
  assert.equal(isValidBachsEventEnvelope({ id: "evt_123", type: "collection.succeeded", data: { checkout_id: "chk_123" } }), true);
});

test("rejects malformed event envelopes", () => {
  for (const event of [null, [], {}, { id: 4, type: "x", data: {} }, { id: "x", type: "", data: {} }, { id: "x", type: "x", data: [] }, { id: "x".repeat(201), type: "x", data: {} }]) {
    assert.equal(isValidBachsEventEnvelope(event), false);
  }
});

test("accepts only bounded string checkout identifiers", () => {
  assert.equal(getBachsCheckoutId({ checkout_id: " chk_123 " }), "chk_123");
  assert.equal(getBachsCheckoutId({ checkout_id: 123 }), "");
  assert.equal(getBachsCheckoutId({ checkout_id: "x".repeat(201) }), "");
  assert.equal(getBachsCheckoutId(null), "");
});

test("matches successful payment only when amount, currency and status agree", () => {
  const order = { amount_minor: 12500, currency: "NGN" };
  assert.equal(matchesBachsSuccessfulPayment({ amount: "125.00", currency: "NGN", status: "SUCCEEDED" }, order), true);
  assert.equal(matchesBachsSuccessfulPayment({ amount: "124.99", currency: "NGN", status: "SUCCEEDED" }, order), false);
  assert.equal(matchesBachsSuccessfulPayment({ amount: "125.001", currency: "NGN", status: "SUCCEEDED" }, order), false);
  assert.equal(matchesBachsSuccessfulPayment({ amount: "125.00.0", currency: "NGN", status: "SUCCEEDED" }, order), false);
  assert.equal(matchesBachsSuccessfulPayment({ amount: "125.00", currency: "USD", status: "SUCCEEDED" }, order), false);
  assert.equal(matchesBachsSuccessfulPayment({ amount: "125.00", currency: "NGN", status: "PENDING" }, order), false);
  assert.equal(matchesBachsSuccessfulPayment({ amount: "Infinity", currency: "NGN", status: "SUCCEEDED" }, order), false);
});

test("allows uncertain checkout retries only inside the 24-hour idempotency window", () => {
  const now = Date.parse("2026-11-01T12:00:00.000Z");
  assert.equal(isWithinBachsIdempotencyWindow("2026-11-01T11:00:00.000Z", now), true);
  assert.equal(isWithinBachsIdempotencyWindow("2026-10-31T12:00:00.001Z", now), true);
  assert.equal(isWithinBachsIdempotencyWindow("2026-10-31T12:00:00.000Z", now), false);
  assert.equal(isWithinBachsIdempotencyWindow("2026-10-31T11:59:59.000Z", now), false);
  assert.equal(isWithinBachsIdempotencyWindow("2026-11-01T12:01:00.000Z", now), false);
  assert.equal(isWithinBachsIdempotencyWindow("invalid-date", now), false);
});

test("parses valid Bachs refund events", () => {
  const result = parseBachsRefundEvent({ type: "refund.paid", data: { reference: "rf_1", refund_id: "id_1", charge_id: "ch_1", refunded_amount: "25.25", currency: "ngn" } });
  assert.deepEqual(result, { reference: "rf_1", refundId: "id_1", chargeId: "ch_1", currency: "NGN", amountMinor: 2525, status: "successful" });
  assert.equal(parseBachsRefundEvent({ type: "refund.paid", data: { reference: "rf_1", refund_id: "id_1", charge_id: "ch_1", refunded_amount: "25.25" } }), null);
  assert.equal(parseBachsRefundEvent({ type: "refund.paid", data: { reference: "rf_1", refund_id: "id_1", charge_id: "ch_1", refunded_amount: "25.25", currency: "USD" } }).currency, "USD");
});

test("rejects malformed Bachs refund events", () => {
  assert.equal(parseBachsRefundEvent({ type: "refund.paid", data: { reference: "rf_1", refund_id: "id_1", charge_id: "ch_1", refunded_amount: "1.001", currency: "NGN" } }), null);
  assert.equal(parseBachsRefundEvent({ type: "refund.created", data: [] }), null);
});
