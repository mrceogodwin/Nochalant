import { createHmac } from "node:crypto";
import { neon } from "@neondatabase/serverless";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const clean = (value, max) => typeof value === "string" ? value.trim().slice(0,max) : "";
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function handlePublicCreatorBooking(req,res) {
  res.setHeader("Cache-Control","no-store, max-age=0");
  res.setHeader("Referrer-Policy","no-referrer");
  if(req.method!=="POST"){res.setHeader("Allow","POST");return res.status(405).json({ok:false,error:"Method not allowed."});}
  const body=req.body||{};
  // Quietly accept honeypot submissions without storing them.
  if(clean(body.website,200))return res.status(202).json({ok:true,message:"Your enquiry has been received."});
  const creatorId=clean(body.creatorId,36);
  const name=clean(body.name,120);
  const email=clean(body.email,254).toLowerCase();
  const message=clean(body.message,3000);
  const requestedForInput=clean(body.requestedFor,80);
  const requestedFor=requestedForInput?new Date(requestedForInput):null;
  if(!uuid.test(creatorId))return res.status(400).json({ok:false,error:"Choose a valid creator profile."});
  if(name.length<2)return res.status(400).json({ok:false,error:"Enter your name."});
  if(!emailPattern.test(email))return res.status(400).json({ok:false,error:"Enter a valid email address."});
  if(message.length<10)return res.status(400).json({ok:false,error:"Please add a little more detail to your enquiry."});
  if(requestedForInput&&(!requestedFor||!Number.isFinite(requestedFor.getTime())||requestedFor.getTime()<Date.now()||requestedFor.getTime()>Date.now()+366*86400000))
    return res.status(400).json({ok:false,error:"Choose a future date within the next 12 months."});
  const rawIp=String(req.headers["x-real-ip"]||req.headers["x-forwarded-for"]||"").split(",").at(-1).trim();
  if(!rawIp)return res.status(429).json({ok:false,error:"Please try again later."});
  const secret=process.env.AUTH_SECRET||process.env.NEON_AUTH_SECRET||process.env.DATABASE_URL_POOLED||process.env.DATABASE_URL;
  const connectionString=process.env.DATABASE_URL_POOLED||process.env.DATABASE_URL;
  if(!secret||!connectionString)return res.status(503).json({ok:false,error:"Booking enquiries are temporarily unavailable."});
  const ipHash=createHmac("sha256",secret).update(rawIp).digest("hex");
  const windowBucket=Math.floor(Date.now()/900000);
  try{
    const sql=neon(connectionString);
    const allowed=await sql`INSERT INTO creator_booking_rate_limits(ip_hash,window_bucket,request_count)
      VALUES(${ipHash},${windowBucket},1)
      ON CONFLICT(ip_hash,window_bucket) DO UPDATE
        SET request_count=creator_booking_rate_limits.request_count+1
        WHERE creator_booking_rate_limits.request_count<5
      RETURNING request_count`;
    if(!allowed.length)return res.status(429).json({ok:false,error:"Too many booking enquiries from this connection. Please try again in 15 minutes."});
    const creator=await sql`SELECT cp.user_profile_id
      FROM creator_profiles cp JOIN user_profiles up ON up.id=cp.user_profile_id
      WHERE cp.user_profile_id=${creatorId} AND cp.booking_enabled=true
        AND up.account_type='creator' AND up.account_status='active'
      LIMIT 1`;
    if(!creator.length)return res.status(404).json({ok:false,error:"Booking enquiries are not available for this creator."});
    const rows=await sql`INSERT INTO creator_booking_requests
      (creator_user_id,requester_name,requester_email,message,requested_for)
      VALUES(${creatorId},${name},${email},${message},${requestedFor?requestedFor.toISOString():null})
      RETURNING id,created_at`;
    // Remove stale rate-limit buckets opportunistically; retain one day for abuse analysis.
    await sql`DELETE FROM creator_booking_rate_limits WHERE window_bucket < ${windowBucket-96}`;
    return res.status(201).json({ok:true,message:"Your booking enquiry has been sent.",requestId:rows[0].id});
  }catch(error){
    if(error?.code==="42P01")return res.status(503).json({ok:false,error:"Booking enquiries are being prepared. Please try again later."});
    console.error("Public creator booking request failed:",error?.message||error);
    return res.status(503).json({ok:false,error:"Your enquiry could not be sent right now. Please try again."});
  }
}


export async function handlePublicCreatorProfile(req,res) {
  res.setHeader("Cache-Control","no-store, max-age=0");
  res.setHeader("Referrer-Policy","strict-origin-when-cross-origin");
  if(req.method!=="GET"){res.setHeader("Allow","GET");return res.status(405).json({ok:false,error:"Method not allowed."});}
  const creatorId=clean(req.query?.id,36);
  if(!uuid.test(creatorId))return res.status(400).json({ok:false,error:"A valid creator profile is required."});
  const connectionString=process.env.DATABASE_URL_POOLED||process.env.DATABASE_URL;
  if(!connectionString)return res.status(503).json({ok:false,error:"Creator profiles are temporarily unavailable."});
  try{
    const sql=neon(connectionString);
    const profiles=await sql`SELECT cp.user_profile_id AS id,cp.display_title,cp.creator_category,cp.bio,cp.location,cp.website_url,cp.booking_enabled
      FROM creator_profiles cp JOIN user_profiles up ON up.id=cp.user_profile_id
      WHERE cp.user_profile_id=${creatorId} AND up.account_type='creator' AND up.account_status='active'
      LIMIT 1`;
    if(!profiles.length)return res.status(404).json({ok:false,error:"Creator profile not found."});
    const portfolio=await sql`SELECT id,title,description,media_url,external_url,sort_order,created_at
      FROM creator_portfolio_items WHERE creator_user_id=${creatorId}
      ORDER BY sort_order ASC,created_at DESC LIMIT 50`;
    return res.status(200).json({ok:true,profile:profiles[0],portfolio});
  }catch(error){
    console.error("Public creator profile failed:",error?.message||error);
    return res.status(503).json({ok:false,error:"Creator profile is temporarily unavailable."});
  }
}
