import { requireActiveUser } from "../_lib/neon-auth.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ ok: false, error: "Method not allowed." });
  }

  const auth = await requireActiveUser(req);
  if (auth.error) {
    return res.status(auth.error.status).json({ ok: false, error: auth.error.message });
  }

  if (auth.profile.role !== "super_admin") {
    return res.status(403).json({ ok: false, error: "This account is not authorized for the Nochalant Control Room." });
  }

  return res.status(200).json({
    ok: true,
    role: "super_admin",
    displayName: auth.profile.display_name
  });
}
