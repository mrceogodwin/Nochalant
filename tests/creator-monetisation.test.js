import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const schema = readFileSync("prisma/schema.prisma", "utf8");
const migration = readFileSync("prisma/migrations/20261108203000_creator_monetisation_foundation/migration.sql", "utf8");
const api = readFileSync("src/app/api/me/creator-earnings/route.ts", "utf8");
const page = readFileSync("src/app/my-club/earnings/page.tsx", "utf8");

test("creator monetisation requires an explicit review status", () => {
  assert.match(schema, /enum CreatorApplicationStatus[\s\S]*PENDING[\s\S]*APPROVED[\s\S]*REJECTED[\s\S]*SUSPENDED/);
  assert.match(schema, /model CreatorMonetizationApplication/);
  assert.match(migration, /CreatorMonetizationApplication_applicantUserId_fkey/);
});

test("creator ledger is idempotent and records availability and reversals", () => {
  const ledger = schema.slice(schema.indexOf("model CreatorLedgerEntry"), schema.indexOf("\\n}", schema.indexOf("model CreatorLedgerEntry")));
  assert.match(ledger, /idempotencyKey String @unique/);
  assert.match(ledger, /availableAt\\s+DateTime\\?/);
  assert.match(ledger, /reversedAt\\s+DateTime\\?/);
  assert.match(migration, /CreatorLedgerEntry_idempotencyKey_key/);
});

test("creator application endpoint authenticates, validates features and blocks duplicate active applications", () => {
  assert.match(api, /if \(!userId\).*401/s);
  assert.match(api, /FEATURES\.has/);
  assert.match(api, /status: \{ in: \["PENDING", "APPROVED"\] \}/);
  assert.match(api, /payoutEnabled: false/);
});

test("creator earnings UI clearly communicates review and payout limitations", () => {
  assert.match(page, /Submit for review/);
  assert.match(page, /Withdrawals are not enabled yet/);
  assert.match(page, /awaiting review/);
});
