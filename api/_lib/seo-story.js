import { neon } from "@neondatabase/serverless";

const SITE_ORIGIN = "https://nochalant.com";
const esc = value => String(value || "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const connection = () => process.env.DATABASE_URL_POOLED || process.env.DATABASE_URL;

export default async function handler(req,res) {
 const slug=String(req.query?.slug||"").slice(0,120);
 if(!slug || !/^[a-z0-9-]+$/.test(slug)) return res.status(400).send("Invalid article URL.");
 if(!connection()) return res.status(503).send("Articles temporarily unavailable.");
 try {
  const sql=neon(connection());
  let a;
  try {
   const rows=await sql`SELECT title,body,category,published_at,slug,seo_title,seo_description,canonical_url,og_image_url,is_indexable FROM submissions WHERE slug=${slug} AND status='published' LIMIT 1`;
   a=rows[0];
  } catch(schemaError) {
   if (!["42P01","42703"].includes(schemaError?.code)) throw schemaError;
   const rows=await sql`SELECT title,body,category,created_at,published_at FROM submissions WHERE status='published' ORDER BY COALESCE(published_at,created_at) DESC LIMIT 5000`;
   const makeSlug=value=>String(value||"").toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,120);
   const matches=rows.filter(row=>makeSlug(row.title)===slug);
   if(matches.length>1) return res.status(409).send("This article URL is ambiguous. Please use its canonical URL.");
   if(matches.length===1) a={...matches[0],slug,seo_title:null,seo_description:null,canonical_url:null,og_image_url:null,is_indexable:true};
  }
  if(!a) return res.status(404).send("Article not found.");
  const title=a.seo_title||a.title, description=a.seo_description||String(a.body||"").slice(0,155);
  const canonical=a.canonical_url||SITE_ORIGIN+"/story/"+slug;
  const image=a.og_image_url||SITE_ORIGIN+"/nochalant-og.jpg";
  const paragraphs=String(a.body||"").split(/\n{2,}/).filter(Boolean).map(p=>"<p>"+esc(p).replace(/\n/g,"<br>")+"</p>").join("");
  const date=a.published_at?new Date(a.published_at).toISOString():new Date().toISOString();
  const jsonLd=JSON.stringify({"@context":"https://schema.org","@type":"NewsArticle","headline":a.title,"description":description,"datePublished":date,"dateModified":date,"mainEntityOfPage":canonical,"image":[image],"author":{"@type":"Organization","name":"Nochalant Editorial Desk"},"publisher":{"@type":"Organization","name":"Nochalant","url":SITE_ORIGIN}});
  res.setHeader("Content-Type","text/html; charset=utf-8");
  res.setHeader("X-Robots-Tag",a.is_indexable===false?"noindex,follow":"index,follow");
  res.setHeader("Cache-Control","public, s-maxage=300, stale-while-revalidate=3600");
  return res.status(200).send(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)} | Nochalant</title><meta name="description" content="${esc(description)}"><link rel="canonical" href="${esc(canonical)}"><meta name="robots" content="${a.is_indexable===false?"noindex,follow":"index,follow"}"><meta property="og:type" content="article"><meta property="og:site_name" content="Nochalant"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${esc(canonical)}"><meta property="og:image" content="${esc(image)}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(description)}"><meta name="twitter:image" content="${esc(image)}"><script type="application/ld+json">${jsonLd.replace(/</g,"\\u003c")}</script><style>body{margin:0;background:#0c0d0b;color:#f4f3ec;font:17px/1.75 system-ui,sans-serif}.wrap{max-width:780px;margin:0 auto;padding:28px 20px 80px}a{color:#d4ff62}.brand{font-weight:900;letter-spacing:.12em;text-decoration:none}h1{font-size:clamp(2rem,6vw,3.5rem);line-height:1.08;margin:28px 0 12px}.meta{color:#aaa;font-size:13px}.hero{width:100%;max-height:440px;object-fit:cover;margin:24px 0}article{overflow-wrap:anywhere}footer{border-top:1px solid #333;padding-top:20px;color:#aaa;font-size:13px}</style></head><body><main class="wrap"><a class="brand" href="/">NOCHALANT.</a><article><p class="meta">${esc(a.category)} · ${esc(date.slice(0,10))}</p><h1>${esc(a.title)}</h1><p class="meta">${esc(description)}</p>${a.og_image_url?"<img class='hero' src='"+esc(image)+"' alt='"+esc(a.title)+"'>":""}${paragraphs}</article><footer>Published by Nochalant Editorial Desk. <a href="/">Explore more stories</a></footer></main></body></html>`);
 } catch(error) { console.error("SEO article rendering failed:",error?.message||error); return res.status(503).send("Article temporarily unavailable."); }
}
