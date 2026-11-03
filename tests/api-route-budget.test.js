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

test("consolidated health and opinions routes have their handlers", () => {
  const config = JSON.parse(readFileSync(join(root, "vercel.json"), "utf8"));
  const rewrites = config.rewrites || [];
  const destinations = new Set(rewrites.map((rewrite) => rewrite.destination.split("?")[0]));
  assert.ok(destinations.has("/api/health"), "Detailed health route must rewrite to /api/health");
  assert.ok(destinations.has("/api/opinions"), "Personal opinions route must rewrite to /api/opinions");
  assert.ok(destinations.has("/api/content"), "SEO and sitemap routes must rewrite to /api/content");
  assert.ok(destinations.has("/api/community"), "Artist and community routes must rewrite to /api/community");
  assert.ok(existsSync(join(apiRoot, "health.js")));
  assert.ok(existsSync(join(apiRoot, "opinions", "index.js")));
});
