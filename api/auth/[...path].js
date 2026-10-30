// Same-origin proxy for Neon Auth. Keeping auth traffic on Nochalant's
// domain allows Safari/iOS browsers to retain the session cookie as first-party.
export default async function handler(req, res) {
  const upstreamBase = process.env.NEON_AUTH_BASE_URL;
  if (!upstreamBase) {
    return res.status(503).json({ message: "Neon Auth proxy is not configured." });
  }

  const rawPath = Array.isArray(req.query?.path) ? req.query.path : [];
  const safePath = rawPath.map(part => String(part)).filter(part => /^[a-zA-Z0-9._~-]+$/.test(part));
  if (safePath.length !== rawPath.length) {
    return res.status(400).json({ message: "Invalid authentication route." });
  }

  const upstream = new URL(upstreamBase.replace(/\/$/, "") + "/" + safePath.join("/"));
  const queryIndex = req.url.indexOf("?");
  if (queryIndex >= 0) upstream.search = req.url.slice(queryIndex);

  const headers = new Headers();
  for (const name of ["accept", "content-type", "cookie", "origin", "user-agent", "authorization"]) {
    const value = req.headers[name];
    if (typeof value === "string") headers.set(name, value);
  }
  // The upstream must validate the real public origin, not the proxy's host.
  headers.set("origin", "https://nochalant.vercel.app");

  const init = { method: req.method, headers, redirect: "manual" };
  if (!["GET", "HEAD"].includes(req.method)) {
    if (typeof req.body === "string") init.body = req.body;
    else if (req.body !== undefined) {
      init.body = JSON.stringify(req.body);
      if (!headers.has("content-type")) headers.set("content-type", "application/json");
    }
  }

  try {
    const response = await fetch(upstream, init);
    res.status(response.status);
    response.headers.forEach((value, name) => {
      if (!["set-cookie", "content-encoding", "content-length", "transfer-encoding", "connection"].includes(name.toLowerCase())) {
        res.setHeader(name, value);
      }
    });

    const cookies = typeof response.headers.getSetCookie === "function"
      ? response.headers.getSetCookie()
      : (response.headers.get("set-cookie") ? [response.headers.get("set-cookie")] : []);
    for (const cookie of cookies) {
      // Remove upstream host scope and remap its auth path to the same-origin proxy.
      const rewritten = cookie
        .replace(/;\s*Domain=[^;]+/ig, "")
        .replace(/;\s*Path=\/neondb\/auth(?:\/[^;]*)?/ig, "; Path=/api/auth")
        .replace(/;\s*SameSite=None/ig, "; SameSite=Lax");
      res.appendHeader("Set-Cookie", rewritten);
    }

    const body = Buffer.from(await response.arrayBuffer());
    return res.send(body);
  } catch (error) {
    console.error("Neon Auth proxy failed:", error?.message || error);
    return res.status(502).json({ message: "Authentication service is temporarily unavailable." });
  }
}
