import { requireActiveUser } from "./neon-auth.js";

const clean = (value, max = 500) => typeof value === "string" ? value.trim().slice(0, max) : "";
const categories = new Set(["Entertainment","Music","Nollywood","Lifestyle","Business","Technology","Politics","Sports","Events","Fashion","Street Culture"]);
const beats = new Set(["Entertainment","Music","Nollywood","Lifestyle","Business","Technology","Politics","Sports","Events","Fashion","Street Culture","Culture"]);
const outletTypes = new Set(["digital_publication","blog","radio","television","print","podcast","other"]);
const httpsUrl = value => {
  if (!value) return null;
  try { const url = new URL(value); return url.protocol === "https:" ? url.toString() : null; }
  catch { return null; }
};
const validEmail = value => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export async function handleMediaWorkspace(req, res) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("Vary", "Authorization");
  if (!["GET","POST"].includes(req.method)) {
    res.setHeader("Allow","GET, POST");
    return res.status(405).json({ok:false,error:"Method not allowed."});
  }
  const auth = await requireActiveUser(req);
  if (auth.error) return res.status(auth.error.status).json({ok:false,error:auth.error.message});
  if (auth.profile.account_type !== "media") return res.status(403).json({ok:false,error:"This workspace is only available to Media / Publisher accounts."});

  try {
    if (req.method === "GET") {
      const [profiles,pitches] = await Promise.all([
        auth.sql`SELECT publication_name,outlet_type,bio,website_url,contact_email,location,beats,created_at,updated_at
          FROM media_profiles WHERE user_profile_id=${auth.profile.id} LIMIT 1`,
        auth.sql`SELECT id,title,category,summary,source_url,status,editor_note,created_at,updated_at
          FROM media_pitch_submissions WHERE user_profile_id=${auth.profile.id}
          ORDER BY created_at DESC LIMIT 100`
      ]);
      return res.status(200).json({ok:true,profile:profiles[0]||null,pitches,
        stats:{total:pitches.length,pending:pitches.filter(p=>p.status==="pending").length}});
    }

    const action = clean(req.body?.action,40);
    if (action === "save_profile") {
      const publicationName=clean(req.body?.publicationName,160);
      const outletType=clean(req.body?.outletType,40)||"digital_publication";
      const bio=clean(req.body?.bio,3000);
      const websiteInput=clean(req.body?.websiteUrl,1000);
      const contactEmail=clean(req.body?.contactEmail,254).toLowerCase();
      const location=clean(req.body?.location,140);
      const selectedBeats=Array.isArray(req.body?.beats) ? [...new Set(req.body.beats.map(x=>clean(x,40)).filter(x=>beats.has(x)))].slice(0,8) : [];
      const website=httpsUrl(websiteInput);
      if(publicationName.length<2)return res.status(400).json({ok:false,error:"Enter a publication or media brand name."});
      if(!outletTypes.has(outletType))return res.status(400).json({ok:false,error:"Choose a valid outlet type."});
      if(websiteInput&&!website)return res.status(400).json({ok:false,error:"Website must be a valid HTTPS address."});
      if(!validEmail(contactEmail))return res.status(400).json({ok:false,error:"Enter a valid editorial contact email."});
      const rows=await auth.sql`INSERT INTO media_profiles
        (user_profile_id,publication_name,outlet_type,bio,website_url,contact_email,location,beats,updated_at)
        VALUES(${auth.profile.id},${publicationName},${outletType},${bio},${website},${contactEmail||null},${location||null},${selectedBeats},now())
        ON CONFLICT(user_profile_id) DO UPDATE SET publication_name=EXCLUDED.publication_name,
          outlet_type=EXCLUDED.outlet_type,bio=EXCLUDED.bio,website_url=EXCLUDED.website_url,
          contact_email=EXCLUDED.contact_email,location=EXCLUDED.location,beats=EXCLUDED.beats,updated_at=now()
        RETURNING publication_name,outlet_type,bio,website_url,contact_email,location,beats,created_at,updated_at`;
      return res.status(200).json({ok:true,profile:rows[0]});
    }

    if (action === "submit_pitch") {
      const profile=await auth.sql`SELECT publication_name FROM media_profiles WHERE user_profile_id=${auth.profile.id} LIMIT 1`;
      if(!profile.length)return res.status(409).json({ok:false,error:"Save your publisher profile before submitting a pitch."});
      const title=clean(req.body?.title,180);
      const category=clean(req.body?.category,40)||"Entertainment";
      const summary=clean(req.body?.summary,5000);
      const sourceInput=clean(req.body?.sourceUrl,1000);
      const sourceUrl=httpsUrl(sourceInput);
      if(title.length<8)return res.status(400).json({ok:false,error:"Pitch title must be at least 8 characters."});
      if(!categories.has(category))return res.status(400).json({ok:false,error:"Choose a valid editorial category."});
      if(summary.length<30)return res.status(400).json({ok:false,error:"Add at least 30 characters of pitch context."});
      if(sourceInput&&!sourceUrl)return res.status(400).json({ok:false,error:"Source links must use HTTPS."});
      const rows=await auth.sql`INSERT INTO media_pitch_submissions(user_profile_id,title,category,summary,source_url)
        VALUES(${auth.profile.id},${title},${category},${summary},${sourceUrl})
        RETURNING id,title,category,summary,source_url,status,created_at,updated_at`;
      return res.status(201).json({ok:true,pitch:rows[0]});
    }
    return res.status(400).json({ok:false,error:"Unsupported media workspace action."});
  } catch(error) {
    if(error?.code==="42P01")return res.status(503).json({ok:false,code:"MEDIA_MIGRATION_REQUIRED",error:"Media workspace database migration is not installed in this environment yet."});
    console.error("Nochalant media workspace failed:",error?.message||error);
    return res.status(503).json({ok:false,error:"Media workspace is temporarily unavailable."});
  }
}
