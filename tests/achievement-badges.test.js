import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("badge catalogue defines real participation criteria and original artwork", () => {
  const seed = read("prisma/seed.ts");
  const sprite = read("public/icons/badges/badge-sprite.svg");
  for (const id of ["scene-starter", "scene-regular", "scene-explorer", "first-post", "conversation-starter", "community-voice", "squad-builder", "rising-reputation", "culture-keeper"]) {
    assert.match(seed, new RegExp(`id: "${id}"`));
    assert.match(sprite, new RegExp(`id="${id}"`));
  }
  assert.match(seed, /criteria: \{ metric: "SCENE_COUNT", threshold: 5 \}/);
  assert.match(seed, /criteria: \{ metric: "POST_COUNT", threshold: 1 \}/);
  assert.match(seed, /criteria: \{ metric: "REPUTATION_XP", threshold: 1000 \}/);
});

test("badge awards are derived from database metrics and audited", () => {
  const service = read("src/lib/badges.ts");
  assert.match(service, /sceneMember\.count/);
  assert.match(service, /squadMember\.count/);
  assert.match(service, /clubPost\.count/);
  assert.match(service, /reputationXp/);
  assert.match(service, /badgeCatalog\.findMany/);
  assert.match(service, /BADGE_AUTO_AWARDED/);
  assert.match(service, /if \(existing\) continue/);
});

test("moderator badge revocation requires a reason and writes an audit event", () => {
  const route = read("src/app/api/admin/badges/[userBadgeId]/revoke/route.ts");
  assert.match(route, /requireModerator\(\)/);
  assert.match(route, /min\(8\)\.max\(500\)/);
  assert.match(route, /revokedById: moderator\.id/);
  assert.match(route, /revocationReason: parsed\.data\.reason/);
  assert.match(route, /BADGE_REVOKED/);
  assert.match(route, /tx\.auditLog\.create/);
});

test("member badge collection is authenticated and hides no moderation history", () => {
  const route = read("src/app/api/me/badges/route.ts");
  const page = read("src/app/my-club/badges/page.tsx");
  assert.match(route, /auth\(\)/);
  assert.match(route, /revokedAt/);
  assert.match(page, /api\/me\/badges/);
  assert.match(page, /EARNED/);
  assert.match(page, /REVOKED/);
});

test("badge revocation schema retains actor, timestamp and reason", () => {
  const schema = read("prisma/schema.prisma");
  const migration = read("prisma/migrations/20261108200000_v2_achievement_badges/migration.sql");
  assert.match(schema, /badgeRevocations UserBadge\[\] @relation\("BadgeRevoker"\)/);
  assert.match(schema, /criteria\s+Json @default\("\{\}"\)/);
  assert.match(schema, /revokedBy User\? @relation\("BadgeRevoker"/);
  assert.match(migration, /"revokedAt"/);
  assert.match(migration, /"revokedById"/);
  assert.match(migration, /"revocationReason"/);
  assert.match(migration, /UserBadge_revokedById_fkey/);
});
