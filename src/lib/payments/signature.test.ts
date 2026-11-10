import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";
import { nairaDecimal, verifyBachsSignature } from "./signature.ts";

test("naira amounts are decimal strings, not kobo", () => {
  assert.equal(nairaDecimal(2999), "2999.00");
  assert.equal(nairaDecimal(26999), "26999.00");
});

test("accepts a Bachs v2 signature and rejects a tampered body", () => {
  const secret = "whsec_test";
  const body = JSON.stringify({ type: "collection.succeeded", data: { amount: "2999.00", currency: "NGN" } });
  const timestamp = String(Math.floor(Date.now() / 1000));
  const signature = createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex");
  const headers = new Headers({ "x-bachs-signature-v2": `t=${timestamp},v1=${signature}` });
  assert.equal(verifyBachsSignature(body, headers, [secret]), true);
  assert.equal(verifyBachsSignature(`${body} `, headers, [secret]), false);
});
