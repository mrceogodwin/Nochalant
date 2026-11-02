import { neon } from "@neondatabase/serverless";
export default async function handler(req,res){
 if(req.method!=="GET"){res.setHeader("Allow","GET");return res.status(405).end();}
 const connection=process.env.DATABASE_URL_POOLED||process.env.DATABASE_URL;
 if(!connection)return res.status(503).send("Sitemap temporarily unavailable.");
 try{
  const sql=neon(connection);
  const rows=await sql`SELECT slug,published_at FROM submissions WHERE status='published' AND is_indexable=true AND slug IS NOT NULL ORDER BY published_at DESC LIMIT 50000`;
  const urls=rows.map(row=>{const loc="https://nochalant.vercel.app/story/"+encodeURIComponent(row.slug);const lastmod=row.published_at?new Date(row.published_at).toISOString():null;return "<url><loc>"+loc+"</loc>"+(lastmod?"<lastmod>"+lastmod+"</lastmod>":"")+"</url>";}).join("");
  res.setHeader("Content-Type","application/xml; charset=utf-8");res.setHeader("Cache-Control","public, s-maxage=600, stale-while-revalidate=3600");
  return res.status(200).send('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://nochalant.vercel.app/</loc></url>'+urls+'</urlset>');
 }catch(e){console.error("Sitemap generation failed:",e?.message||e);return res.status(503).send("Sitemap temporarily unavailable.");}
}
