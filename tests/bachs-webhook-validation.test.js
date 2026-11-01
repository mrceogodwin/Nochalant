import test from "node:test";
import assert from "node:assert/strict";
import {
  isValidBachsEventEnvelope,
  getBachsCheckoutId,
  matchesBachsSuccessfulPayment
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
  assert.equal(matchesBachsSuccessfulPayment({ amount: "125.00", currency: "ngn", status: "SUCCEEDED" }, order), true);
  assert.equal(matchesBachsSuccessfulPayment({ amount: "124.99", currency: "NGN", status: "SUCCEEDED" }, order), false);
  assert.equal(matchesBachsSuccessfulPayment({ amount: "125.00", currency: "USD", status: "SUCCEEDED" }, order), false);
  assert.equal(matchesBachsSuccessfulPayment({ amount: "125.00", currency: "NGN", status: "PENDING" }, order), false);
  assert.equal(matchesBachsSuccessfulPayment({ amount: "Infinity", currency: "NGN", status: "SUCCEEDED" }, order), false);
});
