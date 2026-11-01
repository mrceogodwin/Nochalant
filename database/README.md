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

The numbered SQL files are committed to GitHub; that does **not** mean they have been executed in Neon. Apply each file once, in this explicit dependency order, on a non-production Neon branch first. The duplicate numeric prefixes are intentional legacy filenames, so use the full filenames below rather than sorting by filename.

1. `001_initial_schema.sql`
2. `002_platform_expansion.sql`
3. `003_article_views.sql`
4. `004_nochalant_faces.sql`
5. `005_nochalant_opinions_moderation.sql`
6. `006_editorial_artists.sql`
7. `006_artists_spotlight.sql`
8. `006_hot_or_trash_voting.sql`
9. `007_artist_download_counts.sql`
10. `008_account_types.sql`
11. `009_podcast_publishing.sql`
12. `010_paid_artist_verification.sql`
13. `011_promotions_marketplace.sql`
14. `012_podcast_host_profiles.sql`
15. `013_social_video_feature_flag.sql`
16. `013_text_promotion_design.sql`
17. `014_podcast_host_social_links.sql`
18. `015_multi_workspace_accounts.sql`
19. `016_unique_artist_profile_owner.sql`

The new workspace migration is additive and backfills each existing member's current account type without replacing an already selected primary workspace. Do not run it on production until the development branch passes schema and API verification. If any migration fails, stop and inspect the error; do not continue with later migrations or assume a partially executed script completed.

## 4. Verify the schema

After all migrations in the ordered list above complete on the intended branch, open:

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


## 11. Multi-workspace accounts and Podcast team access

Migration 015 creates member workspace memberships, member profile details and the initial Podcast staff account table. This is a schema foundation, not a complete invitation or permission system. Podcast team invitations, per-show assignments, granular action permissions and staff dashboard workflows remain pending application work and must be tested before production. Do not grant Podcast or staff access through a public account-type selector.

The workspace and profile APIs depend on migration 015. Until it is applied to the target Neon branch, those APIs may return a controlled "not ready" response. Never apply this migration directly to production as a shortcut. The current validation branch is a separate preflight environment; successful checks there do not prove that Production is ready.


## 12. Artist profile ownership integrity

Migration 016 adds a unique index on `artist_profiles.owner_user_id`, enforcing one creator-owned Artist profile per member at the database level. Before applying it to any branch, inspect for duplicate owners:

```sql
SELECT owner_user_id, COUNT(*) AS profile_count
FROM artist_profiles
GROUP BY owner_user_id
HAVING COUNT(*) > 1;
```

The migration intentionally fails if duplicates exist. Do not delete or merge profiles automatically; review and reconcile any duplicates first. The isolated preflight branch was checked and currently has no duplicate owners. This does not establish that Production is duplicate-free.
