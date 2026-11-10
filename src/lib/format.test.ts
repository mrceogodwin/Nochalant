import assert from "node:assert/strict";
import test from "node:test";
import { compact, formatNaira } from "./format.ts";

test("formats naira the way the wallet and pro screens do", () => {
  assert.equal(formatNaira(2999), "₦2,999");
  assert.equal(formatNaira(56750, true), "₦56,750.00");
  assert.equal(formatNaira(-20000), "-₦20,000");
});

test("compacts listener counts without rounding 1,196 into 1.2K", () => {
  assert.equal(compact(324), "324");
  assert.equal(compact(1196), "1,196");
  assert.equal(compact(1200), "1.2K");
  assert.equal(compact(12400), "12.4K");
  assert.equal(compact(18700), "18.7K");
});
