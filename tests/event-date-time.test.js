import test from "node:test";
import assert from "node:assert/strict";
import { localDateTimeToIso, toLocalDateTimeInput } from "../src/event-date-time.js";

test("event local datetime inputs convert to explicit ISO instants", () => {
  const previousTimezone = process.env.TZ;
  process.env.TZ = "Africa/Lagos";
  try {
    assert.equal(localDateTimeToIso("2026-11-04T10:30"), "2026-11-04T09:30:00.000Z");
    assert.equal(toLocalDateTimeInput("2026-11-04T09:30:00.000Z"), "2026-11-04T10:30");
  } finally {
    if (previousTimezone === undefined) delete process.env.TZ;
    else process.env.TZ = previousTimezone;
  }
});

test("event datetime helpers safely handle empty or invalid values", () => {
  assert.equal(localDateTimeToIso(""), "");
  assert.equal(toLocalDateTimeInput(""), "");
  assert.equal(toLocalDateTimeInput("not-a-date"), "");
});
