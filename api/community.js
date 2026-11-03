import artistsHandler from "./_lib/artists.js";
import facesHandler from "./_lib/community-faces.js";

export default async function handler(req, res) {
  const type = String(req.query?.type || "");
  if (type === "artists") return artistsHandler(req, res);
  if (type === "faces") return facesHandler(req, res);
  return res.status(404).json({ ok: false, error: "Community route not found." });
}
