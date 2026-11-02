import { requireActiveUser } from "./neon-auth.js";

const slugify = value => String(value||"").normalize("NFKD").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,80);
const composeEditorialCopy = (title, summary, sourceName, sourceUrl) => {
  const clean = String(summary || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0,900);
  const context = clean.length > 40 ? clean : "The development is drawing attention across the entertainment conversation."; 
  return [title, context, "Nochalant is tracking the story as more verified details emerge. This short editorial digest is based on the publisher feed; read the original report for full context and updates.", "Source: " + sourceName, "Original report: " + sourceUrl].join("\n\n");
};
const DEFAULT_SOURCES = [
  { name: "BellaNaija", feed_url: "https://www.bellanaija.com/feed/", category: "Entertainment" },
  { name: "NotJustOk", feed_url: "https://notjustok.com/feed/", category: "Music" },
  { name: "BBC Africa", feed_url: "https://feeds.bbci.co.uk/news/africa/rss.xml", category: "Entertainment" }
];
const textOnly = value => String(value || "").replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").replace(/<[^>]*>/g, " ").replace(/&amp;/g,"&").replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/\s+/g," ").trim();
const tag = (xml, name) => {
  const match = xml.match(new RegExp("<" + name + "(?:\\s[^>]*)?>([\\s\\S]*?)</" + name + ">", "i"));
  return match ? textOnly(match[1]) : "";
};
function parseFeed(xml, source) {
  const entries = [...xml.matchAll(/<(item|entry)\b[^>]*>([\s\S]*?)<\/\1>/gi)].slice(0, 30);
  return entries.map(([, , item]) => {
    const title = tag(item, "title");
    const summary = tag(item, "description") || tag(item, "summary") || tag(item, "content:encoded");
    const linkTag = item.match(/<link\b[^>]*href=["']([^"']+)["'][^>]*\/?\s*>/i);
    const link = linkTag?.[1] || tag(item, "link") || tag(item, "guid");
    const date = tag(item, "pubDate") || tag(item, "published") || tag(item, "updated");
    const image = item.match(/<(?:media:content|media:thumbnail|enclosure)\b[^>]*url=["']([^"']+)["']/i)?.[1] || null;
    try {
      const parsed = new URL(link);
      if (parsed.protocol !== "https:" || !title || title.length < 8) return null;
      return { title: title.slice(0,180), summary: summary.slice(0,1800), source_url: parsed.toString(), image_url: image, category: source.category, source_name: source.name, published_at: date ? new Date(date) : null };
    } catch { return null; }
  }).filter(Boolean);
}
async function verifyImage(imageUrl) {
  if (!imageUrl) return null;
  try {
    const url = new URL(imageUrl);
    if (url.protocol !== "https:" || url.username || url.password) return null;
    const response = await fetch(url, { method: "HEAD", redirect: "manual", signal: AbortSignal.timeout(5000) });
    const type = response.headers.get("content-type") || "";
    const size = Number(response.headers.get("content-length") || 0);
    if (!response.ok || !type.startsWith("image/") || (size && size > 8000000)) return null;
    return url.toString();
  } catch { return null; }
}
async function ensureSources(sql) {
  for (const source of DEFAULT_SOURCES) {
    await sql`INSERT INTO editorial_content_sources (name,feed_url,category) VALUES (${source.name},${source.feed_url},${source.category}) ON CONFLICT (feed_url) DO NOTHING`;
  }
}
async function collect(sql) {
  await ensureSources(sql);
  const sources = await sql`SELECT id,name,feed_url,category FROM editorial_content_sources WHERE enabled=true ORDER BY name`;
  let discovered = 0;
  for (const source of sources) {
    try {
      const response = await fetch(source.feed_url, { headers: { "user-agent": "NochalantEditorialBot/1.0 (+https://nochalant.vercel.app)" }, signal: AbortSignal.timeout(10000) });
      if (!response.ok) continue;
      const xml = (await response.text()).slice(0, 1500000);
      for (const item of parseFeed(xml, source)) {
        const inserted = await sql`INSERT INTO editorial_discovered_items (source_id,title,summary,source_url,image_url,category,source_name,published_at) VALUES (${source.id},${item.title},${item.summary},${item.source_url},${item.image_url},${item.category},${item.source_name},${item.published_at && !Number.isNaN(item.published_at.getTime()) ? item.published_at : null}) ON CONFLICT (source_url) DO NOTHING RETURNING id`;
        discovered += inserted.length;
      }
    } catch (error) { console.warn("Auto-post feed failed:", source.name, error?.message || error); }
  }
  return { discovered, sourceCount: sources.length };
}
async function publish(sql, itemId, authorId) {
  const rows = await sql`SELECT * FROM editorial_discovered_items WHERE id=${itemId} AND status='pending' FOR UPDATE`;
  if (!rows.length) return { published: false, reason: "Already handled or unavailable." };
  const item = rows[0];
  const body = composeEditorialCopy(item.title,item.summary,item.source_name,item.source_url);
  const slug = slugify(item.title) + "-" + String(item.id).slice(0,8);
  const seoDescription = String(item.summary || body).slice(0,155);
  const canonical = "https://nochalant.vercel.app/story/" + slug;
  const fingerprint = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(item.source_url)))).map(b=>b.toString(16).padStart(2,"0")).join("");
  const inserted = await sql`INSERT INTO submissions (author_id,title,body,category,source_url,content_fingerprint,status,published_at,editorial_source,slug,seo_title,seo_description,focus_keyword,canonical_url,og_image_url,is_indexable) VALUES (${authorId},${item.title},${body},${item.category},${item.source_url},${fingerprint},'published',now(),true,${slug},${item.title.slice(0,65)},${seoDescription},${item.category},${canonical},${item.image_url},true) ON CONFLICT DO NOTHING RETURNING id`;
  if (!inserted.length) {
    await sql`UPDATE editorial_discovered_items SET status='dismissed' WHERE id=${itemId}`;
    return { published: false, reason: "Duplicate content." };
  }
  await sql`UPDATE editorial_discovered_items SET status='published',submission_id=${inserted[0].id},published_to_site_at=now() WHERE id=${itemId}`;
  return { published: true, submissionId: inserted[0].id };
}
export async function handleEditorialAutoPost(req,res) {
  const connection = process.env.DATABASE_URL_POOLED || process.env.DATABASE_URL;
  if (!connection) return res.status(503).json({ok:false,error:"Editorial automation database is not configured."});
  const { neon } = await import("@neondatabase/serverless");
  const sql = neon(connection);
  if (req.method === "GET" || req.method === "POST") {
    const isCron = req.headers.authorization === "Bearer " + process.env.CRON_SECRET && !!process.env.CRON_SECRET;
    let actor = null;
    if (!isCron) {
      const auth = await requireActiveUser(req);
      if (auth.error) return res.status(auth.error.status).json({ok:false,error:auth.error.message});
      if (auth.profile.role !== "super_admin") return res.status(403).json({ok:false,error:"Super Admin access required."});
      actor = auth.profile;
    }
    if (req.method === "GET" && !isCron) {
      await ensureSources(sql);
      const [settings, sources, items] = await Promise.all([
        sql`SELECT enabled,daily_limit,last_run_at FROM editorial_auto_post_settings WHERE id=true`,
        sql`SELECT id,name,feed_url,category,enabled FROM editorial_content_sources ORDER BY name`,
        sql`SELECT id,title,summary,source_url,image_url,category,source_name,published_at,status,discovered_at FROM editorial_discovered_items ORDER BY discovered_at DESC LIMIT 100`
      ]);
      return res.status(200).json({ok:true,settings:settings[0]||{enabled:false,daily_limit:5},sources,items});
    }
    const action = String(req.body?.action || "");
    if (isCron || action === "daily_run") {
      const settings = await sql`SELECT enabled,daily_limit FROM editorial_auto_post_settings WHERE id=true`;
      if (!isCron && !settings[0]?.enabled) return res.status(409).json({ok:false,error:"Turn on Auto Post before running the daily job."});
      if (isCron && !settings[0]?.enabled) return res.status(200).json({ok:true,skipped:true,reason:"Auto Post is off."});
      const result = await collect(sql);
      let published = 0;
      const cap = Math.max(1,Math.min(20,Number(settings[0]?.daily_limit)||5));
      const owner = await sql`SELECT id FROM user_profiles WHERE role='super_admin' ORDER BY created_at ASC LIMIT 1`;
      if (owner.length) {
        const queue = await sql`SELECT id FROM editorial_discovered_items WHERE status='pending' ORDER BY published_at DESC NULLS LAST,discovered_at DESC LIMIT ${cap}`;
        for (const item of queue) if ((await publish(sql,item.id,owner[0].id)).published) published++;
      }
      await sql`UPDATE editorial_auto_post_settings SET last_run_at=now() WHERE id=true`;
      return res.status(200).json({ok:true,...result,published});
    }
    if (!actor) return res.status(403).json({ok:false,error:"Super Admin access required."});
    if (action === "toggle") {
      const enabled = req.body?.enabled === true;
      await sql`UPDATE editorial_auto_post_settings SET enabled=${enabled},updated_by=${actor.id},updated_at=now() WHERE id=true`;
      return res.status(200).json({ok:true,enabled});
    }
    if (action === "fetch") {
      const result = await collect(sql);
      const items = await sql`SELECT id,title,summary,source_url,category,source_name,published_at,status FROM editorial_discovered_items WHERE status='pending' ORDER BY published_at DESC NULLS LAST,discovered_at DESC LIMIT 100`;
      return res.status(200).json({ok:true,...result,items});
    }
    if (action === "publish") {
      const result = await publish(sql,String(req.body?.itemId||""),actor.id);
      return res.status(result.published?200:409).json({ok:result.published,...result});
    }
    if (action === "dismiss") {
      await sql`UPDATE editorial_discovered_items SET status='dismissed' WHERE id=${String(req.body?.itemId||"")} AND status='pending'`;
      return res.status(200).json({ok:true});
    }
    return res.status(400).json({ok:false,error:"Unknown editorial automation action."});
  }
  res.setHeader("Allow","GET, POST");
  return res.status(405).json({ok:false,error:"Method not allowed"});
}

export async function handleEditorialLatest(req,res) {
  if (req.method !== "GET") { res.setHeader("Allow","GET"); return res.status(405).json({ok:false,error:"Method not allowed"}); }
  const connection = process.env.DATABASE_URL_POOLED || process.env.DATABASE_URL;
  if (!connection) return res.status(503).json({ok:false,error:"Editorial feed is unavailable."});
  const { neon } = await import("@neondatabase/serverless");
  try {
    const sql=neon(connection);
    const rows=await sql`SELECT s.id,s.title,s.body,s.category,s.published_at,d.image_url,d.source_name,d.source_url,p.display_name AS author_name FROM submissions s JOIN editorial_discovered_items d ON d.submission_id=s.id JOIN user_profiles p ON p.id=s.author_id WHERE s.status='published' AND d.status='published' ORDER BY s.published_at DESC LIMIT 30`;
    return res.status(200).json({ok:true,stories:rows});
  } catch(error) {
    console.error("Editorial public feed failed:",error?.message||error);
    return res.status(503).json({ok:false,error:"Editorial feed is temporarily unavailable."});
  }
}
