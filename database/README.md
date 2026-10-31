# Nochalant database setup and verification

This repository contains ordered SQL migrations. They are committed to GitHub; that does **not** mean they have been executed in Neon.

## 1. Protect the database credentials

A database password was previously shared in chat. Rotate it in Neon before using the connection string again. Do not paste the new password into GitHub, source code, chat, or a `VITE_*` variable.

Use the Nochalant Neon project only:
- Project ID: `fancy-hall-40653071`
- Branch: `production`
- Region: `eu-central-1`

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
5. `database/migrations/005_nochalant_opinions_moderation.sql`
6. `database/migrations/006_editorial_artists.sql`
7. `database/migrations/007_artist_download_counts.sql`
8. `database/migrations/008_account_types.sql`
9. `database/migrations/009_podcast_publishing.sql`

Do not skip a failed migration or run a later migration first. If a script errors, stop and inspect the error before retrying. These files are intended to be re-runnable in most respects, but do not assume a partially failed script completed.

## 4. Verify the schema

After all nine migrations complete, open:

`https://nochalant.vercel.app/api/health/database`

A successful response has:
- `ok: true`
- `database: "connected"`
- `schema: "complete"`
- `present_tables: 37`
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


## 6. Nochalant Opinions and moderation

Migration 005 creates the user-generated Opinions feed and reporting queue, plus account enforcement fields:
- Opinions are created as pending and require moderation before appearing publicly.
- Users can report an opinion once; reports enter the admin review queue.
- Admin moderation records approve, reject, hide, restore, suspend, unsuspend, ban and unban actions.
- Account states are active, suspended or banned. The application API must enforce these states on every write request; hiding a button in the browser is not security.


## 7. Editorial artist spotlight catalog

Migration 006 creates the editorial `artists` catalog used by the homepage spotlight and Super Admin artist manager. This is intentionally separate from `artist_profiles`, which represents creator-owned profiles. The database health endpoint checks both tables.


## 8. Artist music and download counts

Migration 007 adds a server-maintained download counter to published music tracks. The homepage artist spotlight reads verified creator profiles from `artist_profiles` and derives download totals from their published tracks. Counts remain zero until actual track downloads are implemented and recorded by the server; do not seed or invent download figures.


## 9. Member account types

Migration 008 adds `user_profiles.account_type`. Supported types are `fan`, `artist`, `creator`, `event_organizer`, `business`, and `media`. This is a dashboard personalization field only; it must never grant staff, moderation, payment, artist verification, or publishing privileges. Artist profile verification remains separately reviewed by the editorial team.


## 10. Podcast publishing foundation

Migration 009 creates the editorial podcast catalogue:
- `podcast_shows`: show identity, artwork, host, featured state and publishing status.
- `podcast_seasons`: ordered seasons belonging to a show.
- `podcast_episodes`: full episodes, optional season membership, playback URL/object key, visibility and review/publishing state.
- `podcast_clips`: short-form clips linked to full episodes, including optional clip in/out points.

The schema stores media references only. A public catalogue API and Super Admin management API have been added in code, but they are not live until the pending Vercel deployment succeeds. A media bucket, secure upload workflow, transcoding pipeline and actual playback delivery still need to be implemented and tested before real episodes can be published.
