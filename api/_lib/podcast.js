import { neon } from "@neondatabase/serverless";
import { requireActiveUser } from "./neon-auth.js";

const clean = (value, max = 500) => typeof value === "string" ? value.trim().slice(0, max) : "";
const safeHttps = value => {
  const raw = clean(value, 1500);
  if (!raw) return null;
  try { const url = new URL(raw); return url.protocol === "https:" ? url.toString() : null; }
  catch { return null; }
};
const makeSlug = value => clean(value, 140).toLowerCase().normalize("NFKD")
  .replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 110);

export async function handlePodcast(req, res) {
  if (req.method === "GET" && req.query?.admin === "1") {
    const auth = await requireActiveUser(req);
    if (auth.error) return res.status(auth.error.status).json({ ok:false, error:auth.error.message });
    if (auth.profile.role !== "super_admin") return res.status(403).json({ ok:false, error:"Only the Super Admin can access podcast drafts." });
    try {
      const [shows,seasons,episodes,clips] = await Promise.all([
        auth.sql`SELECT * FROM podcast_shows ORDER BY sort_order ASC, created_at DESC LIMIT 100`,
        auth.sql`SELECT * FROM podcast_seasons ORDER BY show_id, season_number DESC LIMIT 200`,
        auth.sql`SELECT * FROM podcast_episodes ORDER BY created_at DESC LIMIT 300`,
        auth.sql`SELECT * FROM podcast_clips ORDER BY created_at DESC LIMIT 300`
      ]);
      return res.status(200).json({ok:true,shows,seasons,episodes,clips});
    } catch (error) {
      console.error("Nochalant podcast admin catalogue failed:",error?.message||error);
      return res.status(503).json({ok:false,error:"Podcast editorial catalogue is unavailable."});
    }
  }
  if (req.method === "GET") {
    const connectionString = process.env.DATABASE_URL_POOLED || process.env.DATABASE_URL;
    if (!connectionString) return res.status(503).json({ ok:false, error:"Podcast catalogue is temporarily unavailable." });
    try {
      const sql = neon(connectionString);
      const [shows, seasons, episodes, clips] = await Promise.all([
        sql`SELECT id, slug, title, description, host_name, host_role, host_bio, host_image_url, cover_image_url, trailer_video_url, is_featured, published_at
            FROM podcast_shows WHERE status='published' ORDER BY is_featured DESC, sort_order ASC, published_at DESC LIMIT 50`,
        sql`SELECT s.id, s.show_id, s.season_number, s.title, s.description, s.published_at
            FROM podcast_seasons s JOIN podcast_shows sh ON sh.id=s.show_id
            WHERE s.status='published' AND sh.status='published'
            ORDER BY s.show_id, s.season_number DESC LIMIT 200`,
        sql`SELECT e.id, e.show_id, e.season_id, e.episode_number, e.slug, e.title, e.description, e.thumbnail_url,
                   e.video_url, e.duration_seconds, e.is_featured, e.published_at
            FROM podcast_episodes e JOIN podcast_shows sh ON sh.id=e.show_id
            WHERE e.status='published' AND e.visibility='public' AND sh.status='published'
            ORDER BY e.is_featured DESC, e.published_at DESC LIMIT 200`,
        sql`SELECT c.id, c.episode_id, c.slug, c.title, c.description, c.thumbnail_url, c.video_url,
                   c.duration_seconds, c.start_seconds, c.end_seconds, c.published_at
            FROM podcast_clips c JOIN podcast_episodes e ON e.id=c.episode_id
            JOIN podcast_shows sh ON sh.id=e.show_id
            WHERE c.status='published' AND e.status='published' AND e.visibility='public' AND sh.status='published'
            ORDER BY c.published_at DESC LIMIT 100`
      ]);
      return res.status(200).json({ ok:true, shows, seasons, episodes, clips });
    } catch (error) {
      console.error("Nochalant public podcast catalogue failed:", error?.message || error);
      return res.status(503).json({ ok:false, error:"Podcast catalogue is temporarily unavailable." });
    }
  }

  if (req.method !== "POST") {
    res.setHeader("Allow","GET, POST");
    return res.status(405).json({ok:false,error:"Method not allowed"});
  }

  const auth = await requireActiveUser(req);
  if (auth.error) return res.status(auth.error.status).json({ok:false,error:auth.error.message});
  if (auth.profile.role !== "super_admin") return res.status(403).json({ok:false,error:"Only the Super Admin can manage podcast publishing."});

  const action = clean(req.body?.action, 40);
  try {
    if (action === "create_show") {
      const title = clean(req.body?.title,180);
      const slug = makeSlug(req.body?.slug || title) || `show-${crypto.randomUUID().slice(0,8)}`;
      const cover = req.body?.coverImageUrl ? safeHttps(req.body.coverImageUrl) : null;
      const trailer = req.body?.trailerVideoUrl ? safeHttps(req.body.trailerVideoUrl) : null;
      if (!title) return res.status(400).json({ok:false,error:"Show title is required."});
      if ((req.body?.coverImageUrl && !cover) || (req.body?.trailerVideoUrl && !trailer)) return res.status(400).json({ok:false,error:"Show media links must use HTTPS."});
      const rows = await auth.sql`INSERT INTO podcast_shows (slug,title,description,host_name,cover_image_url,trailer_video_url)
        VALUES (${slug},${title},${clean(req.body?.description,4000)},${clean(req.body?.hostName,120)||null},${cover},${trailer})
        RETURNING id,slug,title,status`;
      return res.status(201).json({ok:true,show:rows[0]});
    }
    if (action === "update_show_host") {
      const showId = clean(req.body?.showId,36);
      const hostName = clean(req.body?.hostName,120);
      const hostRole = clean(req.body?.hostRole,100);
      const hostBio = clean(req.body?.hostBio,700);
      const hostImage = req.body?.hostImageUrl ? safeHttps(req.body.hostImageUrl) : null;
      if (!/^[0-9a-f-]{36}$/i.test(showId)) return res.status(400).json({ok:false,error:"Choose a valid podcast series."});
      if (req.body?.hostImageUrl && !hostImage) return res.status(400).json({ok:false,error:"Host photo URL must use HTTPS."});
      const rows = await auth.sql`UPDATE podcast_shows SET host_name=${hostName||null}, host_role=${hostRole||null}, host_bio=${hostBio}, host_image_url=${hostImage} WHERE id=${showId} RETURNING id,title,host_name,host_role,host_bio,host_image_url`;
      if (!rows.length) return res.status(404).json({ok:false,error:"Podcast series not found."});
      return res.status(200).json({ok:true,show:rows[0]});
    }
    if (action === "create_season") {
      const showId = clean(req.body?.showId,36);
      const seasonNumber = Number(req.body?.seasonNumber);
      const title = clean(req.body?.title,180);
      if (!/^[0-9a-f-]{36}$/i.test(showId) || !Number.isInteger(seasonNumber) || seasonNumber < 1 || !title)
        return res.status(400).json({ok:false,error:"Choose a show, season number and title."});
      const rows = await auth.sql`INSERT INTO podcast_seasons (show_id,season_number,title,description)
        VALUES (${showId},${seasonNumber},${title},${clean(req.body?.description,4000)})
        RETURNING id,show_id,season_number,title,status`;
      return res.status(201).json({ok:true,season:rows[0]});
    }
    if (action === "create_episode") {
      const showId = clean(req.body?.showId,36);
      const seasonId = clean(req.body?.seasonId,36) || null;
      const title = clean(req.body?.title,180);
      const slug = makeSlug(req.body?.slug || title) || `episode-${crypto.randomUUID().slice(0,8)}`;
      const videoUrl = req.body?.videoUrl ? safeHttps(req.body.videoUrl) : null;
      const thumbnail = req.body?.thumbnailUrl ? safeHttps(req.body.thumbnailUrl) : null;
      const duration = req.body?.durationSeconds == null || req.body?.durationSeconds === "" ? null : Number(req.body.durationSeconds);
      const episodeNumber = req.body?.episodeNumber == null || req.body?.episodeNumber === "" ? null : Number(req.body.episodeNumber);
      if (!/^[0-9a-f-]{36}$/i.test(showId) || !title) return res.status(400).json({ok:false,error:"Choose a show and enter an episode title."});
      if ((req.body?.videoUrl && !videoUrl) || (req.body?.thumbnailUrl && !thumbnail)) return res.status(400).json({ok:false,error:"Episode media links must use HTTPS."});
      if (duration !== null && (!Number.isInteger(duration) || duration < 0)) return res.status(400).json({ok:false,error:"Duration must be a non-negative number of seconds."});
      if (episodeNumber !== null && (!Number.isInteger(episodeNumber) || episodeNumber < 1)) return res.status(400).json({ok:false,error:"Episode number must be a positive integer."});
      const rows = await auth.sql`INSERT INTO podcast_episodes (show_id,season_id,episode_number,slug,title,description,thumbnail_url,video_url,duration_seconds)
        VALUES (${showId},${seasonId},${episodeNumber},${slug},${title},${clean(req.body?.description,4000)},${thumbnail},${videoUrl},${duration})
        RETURNING id,show_id,season_id,episode_number,slug,title,status`;
      return res.status(201).json({ok:true,episode:rows[0]});
    }
    if (action === "create_clip") {
      const episodeId = clean(req.body?.episodeId,36);
      const title = clean(req.body?.title,180);
      const slug = makeSlug(req.body?.slug || title) || `clip-${crypto.randomUUID().slice(0,8)}`;
      const videoUrl = req.body?.videoUrl ? safeHttps(req.body.videoUrl) : null;
      const thumbnail = req.body?.thumbnailUrl ? safeHttps(req.body.thumbnailUrl) : null;
      if (!/^[0-9a-f-]{36}$/i.test(episodeId) || !title) return res.status(400).json({ok:false,error:"Choose an episode and enter a clip title."});
      if ((req.body?.videoUrl && !videoUrl) || (req.body?.thumbnailUrl && !thumbnail)) return res.status(400).json({ok:false,error:"Clip media links must use HTTPS."});
      const rows = await auth.sql`INSERT INTO podcast_clips (episode_id,slug,title,description,thumbnail_url,video_url,duration_seconds,start_seconds,end_seconds)
        VALUES (${episodeId},${slug},${title},${clean(req.body?.description,3000)},${thumbnail},${videoUrl},
          ${Number.isInteger(Number(req.body?.durationSeconds)) ? Number(req.body.durationSeconds) : null},
          ${Number.isInteger(Number(req.body?.startSeconds)) ? Number(req.body.startSeconds) : null},
          ${Number.isInteger(Number(req.body?.endSeconds)) ? Number(req.body.endSeconds) : null})
        RETURNING id,episode_id,slug,title,status`;
      return res.status(201).json({ok:true,clip:rows[0]});
    }
    if (action === "publish_show" || action === "publish_season" || action === "publish_episode" || action === "publish_clip") {
      const id = clean(req.body?.id,36);
      if (!/^[0-9a-f-]{36}$/i.test(id)) return res.status(400).json({ok:false,error:"Select a valid podcast item."});
      const table = action === "publish_show" ? "podcast_shows" : action === "publish_season" ? "podcast_seasons" : action === "publish_episode" ? "podcast_episodes" : "podcast_clips";
      const rows = table === "podcast_shows" ? await auth.sql`UPDATE podcast_shows SET status='published', published_at=COALESCE(published_at,now()) WHERE id=${id} RETURNING id,status`
        : table === "podcast_seasons" ? await auth.sql`UPDATE podcast_seasons SET status='published', published_at=COALESCE(published_at,now()) WHERE id=${id} RETURNING id,status`
        : table === "podcast_episodes" ? await auth.sql`UPDATE podcast_episodes SET status='published', published_at=COALESCE(published_at,now()) WHERE id=${id} AND video_url IS NOT NULL RETURNING id,status`
        : await auth.sql`UPDATE podcast_clips SET status='published', published_at=COALESCE(published_at,now()) WHERE id=${id} AND video_url IS NOT NULL RETURNING id,status`;
      if (!rows.length) return res.status(409).json({ok:false,error:"Item not found or its video URL is missing."});
      return res.status(200).json({ok:true,item:rows[0]});
    }
    return res.status(400).json({ok:false,error:"Unsupported podcast action."});
  } catch (error) {
    console.error("Nochalant podcast management failed:",error?.message||error);
    return res.status(503).json({ok:false,error:"Podcast changes could not be saved. Check required fields and unique slugs."});
  }
}
