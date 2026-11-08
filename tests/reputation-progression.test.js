import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("rank ladder is ordered and rank refresh is derived from active reputation events", () => {
  const seed = read("prisma/seed.ts");
  const service = read("src/lib/reputation.ts");
  const thresholds = [...seed.matchAll(/\["[A-Z_]+", "[^"]+", (\d+)\]/g)].map((match) => Number(match[1]));
  assert.ok(thresholds.length >= 8);
  assert.deepEqual(thresholds, [...thresholds].sort((a, b) => a - b));
  assert.match(service, /where: \{ userId, reversedAt: null \}/);
  assert.match(service, /rankDefinition\.findMany/);
  assert.match(service, /DAILY_XP_LIMIT = 100/);
});

test("leaderboard only returns active, discoverable members and excludes reversed XP", () => {
  const route = read("src/app/api/leaderboard/route.ts");
  assert.match(route, /reversedAt: null/);
  assert.match(route, /status: "ACTIVE"/);
  assert.match(route, /isDiscoverable: true/);
  assert.match(route, /take: 50/);
  assert.match(route, /Cache-Control/);
});

test("member reputation history is authenticated and includes reversed event records", () => {
  const route = read("src/app/api/me/reputation/history/route.ts");
  assert.match(route, /auth\(\)/);
  assert.match(route, /where: \{ userId \}/);
  assert.match(route, /reversedAt/);
  assert.match(route, /take: 50/);
});

test("Club ID links to reputation history and leaderboard", () => {
  const page = read("src/app/my-club/page.tsx");
  assert.match(page, /href="\/my-club\/reputation"/);
  assert.match(page, /href="\/leaderboard"/);
});
