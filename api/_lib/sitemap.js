import { neon } from "@neondatabase/serverless";

const SITE_ORIGIN = "https://nochalant.com";

export default async function handler(req,res){
 if(req.method!=="GET"){res.setHeader("Allow","GET");return res.status(405).end();}
 const connection=process.env.DATABASE_URL_POOLED||process.env.DATABASE_URL;
 if(!connection)return res.status(503).send("Sitemap temporarily unavailable.");
 const sql=neon(connection);
 try{
  let rows;
  try {
   rows=await sql`SELECT slug,published_at FROM submissions WHERE status='published' AND is_indexable=true AND slug IS NOT NULL AND slug<>'' ORDER BY published_at DESC LIMIT 50000`;
  } catch(schemaError) {
   if (!["42P01","42703"].includes(schemaError?.code)) throw schemaError;
   const fallback=await sql`SELECT title,created_at,published_at FROM submissions WHERE status='published' ORDER BY COALESCE(published_at,created_at) DESC LIMIT 50000`;
   const makeSlug=value=>String(value||"").toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,120);
   rows=fallback.map(row=>({slug:makeSlug(row.title),published_at:row.published_at||row.created_at})).filter(row=>row.slug);
  }
  const urls=rows.map(row=>{const loc=SITE_ORIGIN+"/story/"+encodeURIComponent(row.slug);const lastmod=row.published_at?new Date(row.published_at).toISOString():null;return "<url><loc>"+loc+"</loc>"+(lastmod?"<lastmod>"+lastmod+"</lastmod>":"")+"</url>";}).join("");
  res.setHeader("Content-Type","application/xml; charset=utf-8");res.setHeader("Cache-Control","public, s-maxage=600, stale-while-revalidate=3600");
  return res.status(200).send('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>'+SITE_ORIGIN+'/</loc></url>'+urls+'</urlset>');
 }catch(e){console.error("Sitemap generation failed:",e?.message||e);return res.status(503).send("Sitemap temporarily unavailable.");}
}
