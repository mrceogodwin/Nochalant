import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const apiRoot = join(root, "api");

function routeFiles(directory, relative = "") {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const rel = relative ? join(relative, entry.name) : entry.name;
    const absolute = join(directory, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "_lib") return [];
      return routeFiles(absolute, rel);
    }
    return entry.isFile() && entry.name.endsWith(".js") ? [rel] : [];
  });
}

test("Nochalant API route budget stays at or below 10", () => {
  const routes = routeFiles(apiRoot);
  assert.ok(routes.length <= 10, `Found ${routes.length} API route files; Nochalant route budget is 10. Consolidate handlers before adding more.`);
});

test("consolidated health, opinions, content and community routes have handlers", () => {
  const requiredHandlers = [
    "health.js",
    "opinions/index.js",
    "content.js",
    "community.js"
  ];
  for (const handler of requiredHandlers) {
    assert.ok(existsSync(join(apiRoot, handler)), `Missing consolidated API handler: ${handler}`);
  }
});
