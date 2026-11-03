import seoStoryHandler from "./_lib/seo-story.js";
import sitemapHandler from "./_lib/sitemap.js";

const SITE_ORIGIN = "https://nochalant.com";

export default async function handler(req, res) {
  const type = String(req.query?.type || "");
  if (type === "story") return seoStoryHandler(req, res);
  if (type === "sitemap") return sitemapHandler(req, res);
  if (type === "robots") {
    if (req.method !== "GET") { res.setHeader("Allow", "GET"); return res.status(405).end(); }
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
    return res.status(200).send([
      "User-agent: *",
      "Allow: /",
      "Disallow: /api/",
      "Disallow: /control-room",
      "Disallow: /dashboard",
      "Sitemap: " + SITE_ORIGIN + "/sitemap.xml"
    ].join("\n") + "\n");
  }
  return res.status(404).json({ ok: false, error: "Content route not found." });
}
