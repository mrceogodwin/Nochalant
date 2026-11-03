import seoStoryHandler from "./_lib/seo-story.js";
import sitemapHandler from "./_lib/sitemap.js";

export default async function handler(req, res) {
  const type = String(req.query?.type || "");
  if (type === "story") return seoStoryHandler(req, res);
  if (type === "sitemap") return sitemapHandler(req, res);
  if (type === "robots") {
    if (req.method !== "GET") { res.setHeader("Allow", "GET"); return res.status(405).end(); }
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
    return res.status(200).send("User-agent: *\\nAllow: /\\nDisallow: /api/\\nDisallow: /control-room\\nDisallow: /dashboard\\nSitemap: https://nochalant.vercel.app/sitemap.xml\\n");
  }
  return res.status(404).json({ ok: false, error: "Content route not found." });
}
