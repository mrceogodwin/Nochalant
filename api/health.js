import { neon } from "@neondatabase/serverless";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const connectionString = process.env.DATABASE_URL_POOLED || process.env.DATABASE_URL;
  if (!connectionString) {
    return res.status(503).json({ ok: false, error: "Database connection is not configured" });
  }

  try {
    const sql = neon(connectionString);
    const rows = await sql`SELECT 1 AS ok, current_database() AS database`;
    return res.status(200).json({ ok: true, database: rows[0]?.database || "connected" });
  } catch (error) {
    console.error("Neon database health check failed:", error?.message || error);
    return res.status(503).json({ ok: false, error: "Database connection failed" });
  }
}
