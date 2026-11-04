import { requireActiveUser } from "./neon-auth.js";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const clean = (value, max) => String(value ?? "").trim().slice(0, max);
const validUrl = value => {
  if (!value) return true;
  try { return new URL(value).protocol === "https:"; } catch { return false; }
};

export async function handleEventOrganizer(req, res) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("Vary", "Authorization");
  if (!["GET", "POST"].includes(req.method)) return res.status(405).json({ ok:false, error:"Method not allowed." });
  const auth = await requireActiveUser(req);
  if (auth.error) return res.status(auth.error.status).json({ ok:false, error:auth.error.message });
  if (auth.profile.account_type !== "event_organizer") return res.status(403).json({ ok:false, error:"This workspace is only available to Event Organizer accounts." });

  try {
    if (req.method === "GET") {
      const events = await auth.sql`
        SELECT id, title, description, category, venue, city, starts_at, ends_at,
               ticket_url, image_url, status, created_at, updated_at
        FROM agenda_events WHERE created_by = ${auth.profile.id}
        ORDER BY starts_at DESC LIMIT 100
      `;
      return res.status(200).json({ ok:true, events });
    }

    const action = clean(req.body?.action, 32);
    if (action === "create_event" || action === "update_event") {
      const id = clean(req.body?.id, 64);
      const title = clean(req.body?.title, 140);
      const description = clean(req.body?.description, 4000);
      const category = clean(req.body?.category || "Events", 60);
      const venue = clean(req.body?.venue, 180);
      const city = clean(req.body?.city, 100);
      const ticketUrl = clean(req.body?.ticketUrl, 1000);
      const imageUrl = clean(req.body?.imageUrl, 1000);
      const startsAt = new Date(req.body?.startsAt);
      const endsAt = req.body?.endsAt ? new Date(req.body.endsAt) : null;
      if (title.length < 4) return res.status(400).json({ ok:false,error:"Event title must contain at least 4 characters." });
      if (!Number.isFinite(startsAt.getTime()) || (endsAt && (!Number.isFinite(endsAt.getTime()) || endsAt <= startsAt))) return res.status(400).json({ ok:false,error:"Enter valid event dates. The end must be after the start." });
      if (!validUrl(ticketUrl) || !validUrl(imageUrl)) return res.status(400).json({ ok:false,error:"Ticket and image links must use HTTPS." });
      if (action === "create_event") {
        const rows = await auth.sql`
          INSERT INTO agenda_events (title, description, category, venue, city, starts_at, ends_at, ticket_url, image_url, status, created_by)
          VALUES (${title}, ${description}, ${category}, ${venue || null}, ${city || null}, ${startsAt.toISOString()}, ${endsAt ? endsAt.toISOString() : null}, ${ticketUrl || null}, ${imageUrl || null}, 'draft', ${auth.profile.id})
          RETURNING id, title, description, category, venue, city, starts_at, ends_at, ticket_url, image_url, status, created_at, updated_at
        `;
        return res.status(201).json({ ok:true,event:rows[0] });
      }
      if (!uuid.test(id)) return res.status(400).json({ ok:false,error:"Invalid event." });
      const rows = await auth.sql`
        UPDATE agenda_events SET title=${title}, description=${description}, category=${category},
          venue=${venue || null}, city=${city || null}, starts_at=${startsAt.toISOString()},
          ends_at=${endsAt ? endsAt.toISOString() : null}, ticket_url=${ticketUrl || null}, image_url=${imageUrl || null}
        WHERE id=${id} AND created_by=${auth.profile.id} AND status='draft'
        RETURNING id, title, description, category, venue, city, starts_at, ends_at, ticket_url, image_url, status, created_at, updated_at
      `;
      if (!rows.length) return res.status(404).json({ ok:false,error:"Draft event not found. Only your own drafts can be edited." });
      return res.status(200).json({ ok:true,event:rows[0] });
    }

    if (action === "delete_event") {
      const id = clean(req.body?.id, 64);
      if (!uuid.test(id)) return res.status(400).json({ ok:false,error:"Invalid event." });
      const rows = await auth.sql`DELETE FROM agenda_events WHERE id=${id} AND created_by=${auth.profile.id} AND status='draft' RETURNING id`;
      if (!rows.length) return res.status(404).json({ ok:false,error:"Draft event not found." });
      return res.status(200).json({ ok:true,deletedId:rows[0].id });
    }
    return res.status(400).json({ ok:false,error:"Unsupported event action." });
  } catch (error) {
    console.error("Nochalant event workspace failed:", error?.message || error);
    return res.status(503).json({ ok:false,error:"Events could not be loaded or saved. Please try again." });
  }
}
