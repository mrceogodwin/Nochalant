# Nochalant database setup and verification

This repository contains ordered SQL migrations. They are committed to GitHub; that does **not** mean they have been executed in Neon.

## 1. Protect the database credentials

A database password was previously shared in chat. Rotate it in Neon before using the connection string again. Do not paste the new password into GitHub, source code, chat, or a `VITE_*` variable.

Use the Nochalant Neon project only:
- Project ID: `wandering-shadow-81898225`
- Branch: `production`
- Region: `us-east-2`

Do not use a different Neon project just because it appears under another connected account.

## 2. Configure Vercel server-side variables

In the Vercel project `nochalant`, add the rotated Neon connection strings for Production, Preview and Development as appropriate:

- `DATABASE_URL_POOLED`: pooled Neon connection string (preferred for serverless requests).
- `DATABASE_URL`: direct Neon connection string (use for migration tooling and fallback only).

These are server-only variables. Never prefix them with `VITE_`. The existing `VITE_NEON_AUTH_URL` is a public auth endpoint and is not a PostgreSQL connection string.

After adding or changing environment variables, redeploy the project so the deployment receives them.

## 3. Apply migrations in order

Open the SQL Editor for the Nochalant Neon project and select the `production` branch. Execute each complete file in this exact order, waiting for success before proceeding:

1. `database/migrations/001_initial_schema.sql`
2. `database/migrations/002_platform_expansion.sql`
3. `database/migrations/003_article_views.sql`
4. `database/migrations/004_nochalant_faces.sql`

Do not skip a failed migration or run a later migration first. If a script errors, stop and inspect the error before retrying. These files are intended to be re-runnable in most respects, but do not assume a partially failed script completed.

## 4. Verify the schema

After all four migrations complete, open:

`https://nochalant.vercel.app/api/health/database`

A successful response has:
- `ok: true`
- `database: "connected"`
- `schema: "complete"`
- `present_tables: 30`
- `missing_tables: []`

If the endpoint says `not_configured`, the server-side Vercel variables are missing. If it says `unavailable`, check the connection string and Neon access. If it says `incomplete`, apply or repair the listed migrations in order.

## 5. Verify Nochalant Faces

Open:

`https://nochalant.vercel.app/api/community/faces`

After migration 004, the response should include the ten explicitly marked demo profiles. They are demo records, not real registered users. Do not present them as real community members.

## Security notes

- Never expose database credentials in frontend bundles or API responses.
- Never trust a role, user ID, or payment status supplied by the browser.
- Keep Neon Auth and PostgreSQL connection configuration distinct.
- Do not manually edit production tables to bypass the migration sequence.
