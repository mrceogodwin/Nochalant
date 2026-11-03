import { requireActiveUser } from "./neon-auth.js";

const clean=(v,n)=>String(v??"").trim().slice(0,n);
const validHttps=v=>{if(!v)return true;try{return new URL(v).protocol==="https:";}catch{return false;}};
const emailOk=v=>!v||/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

export async function handleBusinessWorkspace(req,res){
  if(!["GET","POST"].includes(req.method)){res.setHeader("Allow","GET, POST");return res.status(405).json({ok:false,error:"Method not allowed."});}
  const auth=await requireActiveUser(req);
  if(auth.error)return res.status(auth.error.status).json({ok:false,error:auth.error.message});
  if(auth.profile.account_type!=="business")return res.status(403).json({ok:false,error:"This workspace is only available to Business accounts."});
  try{
    if(req.method==="GET"){
      const rows=await auth.sql`SELECT id,business_name,category,bio,website_url,contact_email,location,logo_url,created_at,updated_at FROM business_profiles WHERE user_profile_id=${auth.profile.id} LIMIT 1`;
      return res.status(200).json({ok:true,profile:rows[0]||null});
    }
    const businessName=clean(req.body?.businessName,140);
    const category=clean(req.body?.category||"Other",80);
    const bio=clean(req.body?.bio,2000);
    const website=clean(req.body?.websiteUrl,1000);
    const contact=clean(req.body?.contactEmail,254).toLowerCase();
    const location=clean(req.body?.location,140);
    const logo=clean(req.body?.logoUrl,1000);
    if(businessName.length<2)return res.status(400).json({ok:false,error:"Enter a business name with at least 2 characters."});
    if(!validHttps(website)||!validHttps(logo))return res.status(400).json({ok:false,error:"Website and logo links must use HTTPS."});
    if(!emailOk(contact))return res.status(400).json({ok:false,error:"Enter a valid contact email."});
    const rows=await auth.sql`
      INSERT INTO business_profiles(user_profile_id,business_name,category,bio,website_url,contact_email,location,logo_url)
      VALUES(${auth.profile.id},${businessName},${category},${bio},${website||null},${contact||null},${location||null},${logo||null})
      ON CONFLICT(user_profile_id) DO UPDATE SET business_name=EXCLUDED.business_name,category=EXCLUDED.category,bio=EXCLUDED.bio,
        website_url=EXCLUDED.website_url,contact_email=EXCLUDED.contact_email,location=EXCLUDED.location,logo_url=EXCLUDED.logo_url
      RETURNING id,business_name,category,bio,website_url,contact_email,location,logo_url,created_at,updated_at
    `;
    return res.status(200).json({ok:true,profile:rows[0]});
  }catch(error){
    console.error("Business workspace failed:",error?.message||error);
    return res.status(503).json({ok:false,error:"Your business profile could not be loaded or saved."});
  }
}
