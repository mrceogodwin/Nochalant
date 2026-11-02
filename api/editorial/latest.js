import { neon } from "@neondatabase/serverless";
export default async function handler(req,res){
 if(req.method!=="GET"){res.setHeader("Allow","GET");return res.status(405).json({ok:false,error:"Method not allowed."});}
 const connection=process.env.DATABASE_URL_POOLED||process.env.DATABASE_URL;
 if(!connection)return res.status(503).json({ok:false,error:"Editorial feed unavailable."});
 try{
  const sql=neon(connection);
  const rows=await sql`SELECT s.id,s.title,s.body,s.category,s.created_at,s.published_at,s.source_url,p.display_name AS author_name,d.image_url,d.source_name
   FROM submissions s
   JOIN user_profiles p ON p.id=s.author_id
   LEFT JOIN editorial_discovered_items d ON d.submission_id=s.id
   WHERE s.status='published'
   ORDER BY COALESCE(s.published_at,s.created_at) DESC
   LIMIT 60`;
  return res.status(200).json({ok:true,stories:rows.map(row=>({id:row.id,title:row.title,body:row.body,excerpt:String(row.body||"").split("\n")[0].slice(0,220),category:row.category,image_url:row.image_url||null,author_name:row.author_name||"Nochalant Editorial Desk",published_at:row.published_at||row.created_at,source_url:row.source_url,source_name:row.source_name,read:"2 min read"}))});
 }catch(error){console.error("Editorial feed failed:",error?.message||error);return res.status(503).json({ok:false,error:"Editorial feed is temporarily unavailable."});}
}
