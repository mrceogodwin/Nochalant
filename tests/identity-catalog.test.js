const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const sprite = fs.readFileSync(path.join(root, "public/icons/identities/sprite.svg"), "utf8");
const seed = fs.readFileSync(path.join(root, "prisma/seed.ts"), "utf8");
const registration = fs.readFileSync(path.join(root, "src/app/api/register/route.ts"), "utf8");
const unlockRoute = fs.readFileSync(path.join(root, "src/app/api/me/icons/unlock/route.ts"), "utf8");
const selectRoute = fs.readFileSync(path.join(root, "src/app/api/me/icons/select/route.ts"), "utf8");
const collectionPage = fs.readFileSync(path.join(root, "src/app/my-club/icons/page.tsx"), "utf8");

test("identity sprite contains 120 catalogue and eight starter symbols", () => {
  const ids = [...sprite.matchAll(/<symbol id="(identity-\d{3}|starter-\d{3})"/g)].map((match) => match[1]);
  assert.equal(ids.length, 128);
  assert.equal(new Set(ids).size, 128);
  assert.ok(ids.includes("identity-120"));
  assert.ok(ids.includes("starter-008"));
});

test("seed persists sprite references and server-verifiable unlock rules", () => {
  assert.match(seed, /sprite\.svg#/);
  assert.match(seed, /REPUTATION_XP/);
  assert.match(seed, /ADMIN_ONLY/);
  assert.match(seed, /FOUNDERS_EDITION/);
});

test("registration grants the eight starter identities and chooses the onboarding identity", () => {
  assert.match(registration, /starter-\$\{String\(index \+ 1\)\.padStart\(3, "0"\)\}/);
  assert.match(registration, /userIcon\.createMany/);
  assert.match(registration, /identityIconId: primaryIcon\.id/);
});

test("identity unlock endpoint uses authenticated server-side XP and admin checks", () => {
  assert.match(unlockRoute, /auth\(\)/);
  assert.match(unlockRoute, /reputationXp/);
  assert.match(unlockRoute, /adminAssignments/);
  assert.match(unlockRoute, /userIcon\.create/);
  assert.doesNotMatch(unlockRoute, /body\.xp|body\.points|body\.userId/);
});

test("identity selection requires ownership and persists the primary icon", () => {
  assert.match(selectRoute, /userIcon\.findUnique/);
  assert.match(selectRoute, /You haven't unlocked this icon yet/);
  assert.match(selectRoute, /isPrimary: true/);
  assert.match(selectRoute, /identityIconId: parsed\.data\.iconId/);
});

test("collection UI renders original SVGs and unlock/select actions", () => {
  assert.match(collectionPage, /<use href=\{item\.svgPath\}/);
  assert.match(collectionPage, /api\/me\/icons\/unlock/);
  assert.match(collectionPage, /api\/me\/icons\/select/);
});
