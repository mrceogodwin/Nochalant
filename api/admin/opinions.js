import { requireActiveUser } from "../_lib/neon-auth.js";

const opinionStatuses = { approve: "published", reject: "removed", hide: "hidden", restore: "published" };
const accountActions = ["suspend","unsuspend","ban","unban"];

export default async function handler(req, res) {
  const auth = await requireActiveUser(req);
  if (auth.error) return res.status(auth.error.status).json({ ok: false, error: auth.error.message });
  if (auth.profile.role !== "super_admin") return res.status(403).json({ ok: false, error: "Only the Super Admin can moderate content." });
  if (req.method === "GET") {
    try {
      const [opinions, reports, users] = await Promise.all([
        auth.sql`SELECT o.id, o.body, o.topic, o.status, o.created_at, p.display_name AS author_name FROM community_opinions o JOIN user_profiles p ON p.id = o.author_id WHERE o.status IN ('pending','hidden') ORDER BY o.created_at ASC LIMIT 100`,
        auth.sql`SELECT r.id, r.opinion_id, r.reason, r.details, r.status, r.created_at, o.body AS opinion_body, p.display_name AS reporter_name FROM opinion_reports r JOIN community_opinions o ON o.id = r.opinion_id JOIN user_profiles p ON p.id = r.reporter_id WHERE r.status IN ('open','reviewing') ORDER BY r.created_at ASC LIMIT 100`,
        auth.sql`SELECT id, display_name, email, role, account_status, suspended_until FROM user_profiles WHERE role <> 'super_admin' ORDER BY created_at DESC LIMIT 100`
      ]);
      return res.status(200).json({ ok: true, opinions, reports, users });
    } catch (error) {
      console.error("Nochalant moderation queue failed:", error?.message || error);
      return res.status(503).json({ ok: false, error: "Moderation queue is temporarily unavailable." });
    }
  }
  if (req.method !== "POST") { res.setHeader("Allow", "GET, POST"); return res.status(405).json({ ok: false, error: "Method not allowed" }); }
  const action = String(req.body?.action || "");
  const opinionId = String(req.body?.opinionId || "");
  const reportId = String(req.body?.reportId || "");
  const targetUserId = String(req.body?.targetUserId || "");
  const reason = typeof req.body?.reason === "string" ? req.body.reason.trim().slice(0,500) : "";
  try {
    if (Object.hasOwn(opinionStatuses, action)) {
      if (!/^[0-9a-f-]{36}$/i.test(opinionId)) return res.status(400).json({ ok:false,error:"Invalid opinion." });
      const status = opinionStatuses[action];
      const auditAction = action === "approve" ? "approve_opinion" : action === "reject" ? "reject_opinion" : action;
      const rows = await auth.sql`WITH changed AS (
        UPDATE community_opinions SET status = ${status}, published_at = CASE WHEN ${status} = 'published' THEN COALESCE(published_at, now()) ELSE published_at END, moderated_by = ${auth.profile.id}, moderated_at = now(), moderation_note = ${reason}
        WHERE id = ${opinionId} RETURNING id, status
      ), logged AS (
        INSERT INTO moderation_actions (moderator_id, opinion_id, action, reason)
        SELECT ${auth.profile.id}, changed.id, ${auditAction}, ${reason || "Moderation review"} FROM changed RETURNING id
      ) SELECT changed.id, changed.status FROM changed`;
      if (!rows.length) return res.status(404).json({ ok:false,error:"Opinion not found." });
      return res.status(200).json({ ok:true, opinion:rows[0] });
    }
    if (action === "resolve_report" || action === "dismiss_report") {
      if (!/^[0-9a-f-]{36}$/i.test(reportId)) return res.status(400).json({ ok:false,error:"Invalid report." });
      const status = action === "resolve_report" ? "resolved" : "dismissed";
      const rows = await auth.sql`WITH changed AS (
        UPDATE opinion_reports SET status = ${status}, reviewed_by = ${auth.profile.id}, reviewed_at = now()
        WHERE id = ${reportId} AND status IN ('open','reviewing') RETURNING id, status, opinion_id
      ), logged AS (
        INSERT INTO moderation_actions (moderator_id, opinion_id, action, reason)
        SELECT ${auth.profile.id}, changed.opinion_id, ${action}, ${reason || status} FROM changed RETURNING id
      ) SELECT changed.id, changed.status, changed.opinion_id FROM changed`;
      if (!rows.length) return res.status(404).json({ ok:false,error:"Open report not found." });
      return res.status(200).json({ ok:true, report:rows[0] });
    }
    if (accountActions.includes(action)) {
      if (!/^[0-9a-f-]{36}$/i.test(targetUserId)) return res.status(400).json({ ok:false,error:"Invalid account." });
      if (targetUserId === auth.profile.id) return res.status(400).json({ ok:false,error:"You cannot change your own account status." });
      const status = action === "ban" ? "banned" : action === "suspend" ? "suspended" : "active";
      const until = action === "suspend" && req.body?.suspendedUntil ? new Date(req.body.suspendedUntil) : null;
      if (until && Number.isNaN(until.getTime())) return res.status(400).json({ ok:false,error:"Invalid suspension expiry." });
      const rows = await auth.sql`WITH changed AS (
        UPDATE user_profiles SET account_status = ${status}, suspended_until = ${status === "suspended" ? until : null}, moderation_note = ${reason}, moderated_at = now(), moderated_by = ${auth.profile.id}
        WHERE id = ${targetUserId} AND role <> 'super_admin' RETURNING id, account_status, suspended_until
      ), logged AS (
        INSERT INTO moderation_actions (moderator_id, target_user_id, action, reason)
        SELECT ${auth.profile.id}, changed.id, ${action}, ${reason || action} FROM changed RETURNING id
      ) SELECT changed.id, changed.account_status, changed.suspended_until FROM changed`;
      if (!rows.length) return res.status(404).json({ ok:false,error:"Account not found or protected." });
      return res.status(200).json({ ok:true, account:rows[0] });
    }
    return res.status(400).json({ ok:false,error:"Unsupported moderation action." });
  } catch (error) {
    console.error("Nochalant moderation action failed:", error?.message || error);
    return res.status(503).json({ ok:false,error:"The moderation action could not be completed." });
  }
}