import { requireActiveUser } from "./neon-auth.js";

const clean = (value, max = 500) => typeof value === "string" ? value.trim().slice(0, max) : "";
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const safeHttps = value => {
  if (!value) return null;
  try { const parsed = new URL(value); return parsed.protocol === "https:" ? parsed.toString() : null; }
  catch { return null; }
};

export async function handleCreatorWorkspace(req, res) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("Vary", "Authorization");
  if (!["GET", "POST"].includes(req.method)) {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }
  const auth = await requireActiveUser(req);
  if (auth.error) return res.status(auth.error.status).json({ ok: false, error: auth.error.message });
  if (auth.profile.account_type !== "creator") return res.status(403).json({ ok: false, error: "This workspace is available to Creator accounts." });

  try {
    if (req.method === "GET") {
      const [profiles, portfolio, bookings] = await Promise.all([
        auth.sql`SELECT display_title, creator_category, bio, location, website_url, contact_email, booking_enabled, created_at, updated_at
          FROM creator_profiles WHERE user_profile_id = ${auth.profile.id} LIMIT 1`,
        auth.sql`SELECT id, title, description, media_url, external_url, sort_order, created_at, updated_at
          FROM creator_portfolio_items WHERE creator_user_id = ${auth.profile.id}
          ORDER BY sort_order ASC, created_at DESC LIMIT 100`,
        auth.sql`SELECT id, requester_name, requester_email, message, requested_for, status, creator_note, created_at, updated_at
          FROM creator_booking_requests WHERE creator_user_id = ${auth.profile.id}
          ORDER BY created_at DESC LIMIT 100`
      ]);
      return res.status(200).json({ ok: true, creatorId: auth.profile.id, profile: profiles[0] || null, portfolio, bookings,
        stats: { portfolioItems: portfolio.length, pendingBookings: bookings.filter(item => item.status === "pending").length } });
    }

    const action = clean(req.body?.action, 40);
    if (action === "save_profile") {
      const displayTitle = clean(req.body?.displayTitle, 120);
      const category = clean(req.body?.category, 40) || "content_creator";
      const bio = clean(req.body?.bio, 3000);
      const location = clean(req.body?.location, 120);
      const websiteInput = clean(req.body?.websiteUrl, 1000);
      const email = clean(req.body?.contactEmail, 254).toLowerCase();
      const categories = ["content_creator","influencer","photographer","videographer","writer","presenter","comedian","other"];
      const website = safeHttps(websiteInput);
      if (!displayTitle) return res.status(400).json({ ok: false, error: "Add a public creator or brand name." });
      if (!categories.includes(category)) return res.status(400).json({ ok: false, error: "Choose a valid creator category." });
      if (websiteInput && !website) return res.status(400).json({ ok: false, error: "Website must be a valid HTTPS address." });
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ ok: false, error: "Enter a valid booking contact email." });
      const rows = await auth.sql`INSERT INTO creator_profiles
        (user_profile_id, display_title, creator_category, bio, location, website_url, contact_email, updated_at)
        VALUES (${auth.profile.id}, ${displayTitle}, ${category}, ${bio}, ${location || null}, ${website}, ${email || null}, now())
        ON CONFLICT (user_profile_id) DO UPDATE SET display_title = EXCLUDED.display_title,
          creator_category = EXCLUDED.creator_category, bio = EXCLUDED.bio, location = EXCLUDED.location,
          website_url = EXCLUDED.website_url, contact_email = EXCLUDED.contact_email, updated_at = now()
        RETURNING display_title, creator_category, bio, location, website_url, contact_email, booking_enabled, updated_at`;
      return res.status(200).json({ ok: true, profile: rows[0] });
    }
    if (action === "set_booking_enabled") {
      if (typeof req.body?.enabled !== "boolean") return res.status(400).json({ ok: false, error: "Choose whether booking enquiries are enabled." });
      const rows = await auth.sql`UPDATE creator_profiles SET booking_enabled = ${req.body.enabled}, updated_at = now()
        WHERE user_profile_id = ${auth.profile.id} RETURNING booking_enabled`;
      if (!rows.length) return res.status(409).json({ ok: false, error: "Save your creator profile before enabling bookings." });
      return res.status(200).json({ ok: true, bookingEnabled: rows[0].booking_enabled });
    }
    if (action === "add_portfolio_item") {
      const title = clean(req.body?.title, 120);
      const description = clean(req.body?.description, 1000);
      const mediaInput = clean(req.body?.mediaUrl, 1000);
      const externalInput = clean(req.body?.externalUrl, 1000);
      const mediaUrl = safeHttps(mediaInput);
      const externalUrl = safeHttps(externalInput);
      if (title.length < 2) return res.status(400).json({ ok: false, error: "Portfolio title must be at least 2 characters." });
      if ((mediaInput && !mediaUrl) || (externalInput && !externalUrl)) return res.status(400).json({ ok: false, error: "Portfolio links must use HTTPS." });
      if (!mediaUrl && !externalUrl) return res.status(400).json({ ok: false, error: "Add a secure media or project link." });
      const rows = await auth.sql`INSERT INTO creator_portfolio_items
        (creator_user_id, title, description, media_url, external_url)
        VALUES (${auth.profile.id}, ${title}, ${description}, ${mediaUrl}, ${externalUrl})
        RETURNING id, title, description, media_url, external_url, sort_order, created_at`;
      return res.status(201).json({ ok: true, item: rows[0] });
    }
    if (action === "delete_portfolio_item") {
      const id = String(req.body?.itemId || "");
      if (!uuid.test(id)) return res.status(400).json({ ok: false, error: "Choose a valid portfolio item." });
      const rows = await auth.sql`DELETE FROM creator_portfolio_items
        WHERE id = ${id} AND creator_user_id = ${auth.profile.id} RETURNING id`;
      if (!rows.length) return res.status(404).json({ ok: false, error: "Portfolio item not found." });
      return res.status(200).json({ ok: true, deleted: true });
    }
    if (action === "update_booking_status") {
      const id = String(req.body?.bookingId || "");
      const status = clean(req.body?.status, 20);
      const note = clean(req.body?.creatorNote, 1000);
      if (!uuid.test(id) || !["accepted","declined","cancelled"].includes(status)) return res.status(400).json({ ok: false, error: "Choose a valid booking request and status." });
      const rows = await auth.sql`UPDATE creator_booking_requests SET status = ${status}, creator_note = ${note || null}, updated_at = now()
        WHERE id = ${id} AND creator_user_id = ${auth.profile.id} AND status = 'pending'
        RETURNING id, status, creator_note, updated_at`;
      if (!rows.length) return res.status(404).json({ ok: false, error: "Pending booking request not found." });
      return res.status(200).json({ ok: true, booking: rows[0] });
    }
    return res.status(400).json({ ok: false, error: "Unsupported creator workspace action." });
  } catch (error) {
    if (error?.code === "42P01") return res.status(503).json({ ok: false, code: "CREATOR_MIGRATION_REQUIRED", error: "Creator workspace database migration is not installed on this environment yet." });
    console.error("Nochalant creator workspace failed:", error?.message || error);
    return res.status(503).json({ ok: false, error: "Creator workspace is temporarily unavailable." });
  }
}
