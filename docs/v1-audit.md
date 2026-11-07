# Nochalant v1 — Read-only audit

Audit date: 2026-11-07  
Scope: read-only inspection of GitHub `main`, Vercel project metadata, and Neon production schema/counts. No production writes, migrations, seeds, resets, DNS changes, or environment-variable changes were performed.

## Repository and framework

- Repository: `mrceogodwin/Nochalant`; default branch: `main`.
- Main head inspected: `96d5816658f4ac76a8b53c0794986f31e8b26e6d` (“Clear production homepage while preserving floating audio player”).
- Framework: Vite 8 + React 19, JavaScript (not Next.js, not TypeScript).
- Build: `vite build`; tests: Node's built-in test runner (`node --test`).
- Client dependencies include `@neondatabase/auth`, `@neondatabase/serverless`, and `jose`.
- Existing UI is a culture/editorial site with social feed, artists/music, opinions, podcast, editorial administration and floating audio-player code. V2 must not reuse these routes, components, styling, copy or feature implementations.

## Hosting

- Vercel project: `nochalant`, project ID `prj_GRbkmd57y0Eo7ElQCfade4crWmSP`.
- Existing custom domains include `nochalant.com`, `www.nochalant.com`, and `nochalant.vercel.app`.
- Latest deployment metadata reported READY with target `production`; project has SSO protection enabled for non-custom domains.
- No production domain, DNS, production environment variable, or deployment configuration was changed in this audit.

## Database and authentication

- Neon project: `fancy-hall-40653071`; production branch: `br-jolly-term-ba4i3ynt`; database: `neondb`.
- Production contains the Neon Auth schema and existing v1 public tables, including editorial, social, artists/music, payments, subscriptions and user profile tables.
- Read-only counts on production: `public.user_profiles` = 3 rows; `neon_auth.user` = 4 rows; `public.artist_profiles` = 1 row. These are real existing records. Do not migrate, overwrite, or seed them as part of v2 without a separate explicit instruction.
- Neon Auth uses `neon_auth.user` with email and emailVerified fields. V1 application profiles live in `public.user_profiles`, keyed to auth IDs. This is not the v2 Auth.js architecture and must not be reused without a deliberate security review.
- Existing schema has many v1 feature tables; v2 will use a fresh, independently versioned Prisma schema and migrations on `v2-dev` only.

## Risk and migration decision

- Treat v1 as a legacy product. Preserve it on `legacy/v1`; build v2 on `v2`.
- A separate Neon branch `v2-dev` has been created from production branch HEAD. It is isolated and currently has the production snapshot; no v2 migrations or seeds have been run.
- Production has existing user records. V2 account/data migration is explicitly out of scope.
- GitHub connector exposes branch creation but no tag-creation operation in this session. The requested `v1-archive` Git tag could not be created through the available GitHub tools; `legacy/v1` is the verified preservation ref.
- Direct terminal network access to GitHub is unavailable in this runtime; repository reads/writes are being performed through the connected GitHub integration.

## Status

This is a bounded Phase 0 audit. It is not a security certification, complete schema review, or production readiness assessment.
