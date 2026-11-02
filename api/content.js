import seoStoryHandler from "./_lib/seo-story.js";
import sitemapHandler from "./_lib/sitemap.js";

export default async function handler(req, res) {
  const type = String(req.query?.type || "");
  if (type === "story") return seoStoryHandler(req, res);
  if (type === "sitemap") return sitemapHandler(req, res);
  return res.status(404).json({ ok: false, error: "Content route not found." });
}
