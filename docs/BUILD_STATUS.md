# Nochalant Club v2 — Build status

Last updated: 2026-11-07

| Phase | Feature | State | Evidence |
|---|---|---|---|
| 0 | Read-only v1 repository, hosting and database audit | DONE & VERIFIED | `docs/v1-audit.md`; GitHub, Vercel metadata and Neon read-only queries |
| 0 | Preserve v1 branch | DONE & VERIFIED | GitHub branch `legacy/v1` created from main |
| 0 | Create v2 branch | DONE & VERIFIED | GitHub branch `v2` created from main |
| 0 | v1-archive Git tag | BLOCKED | GitHub connector has no tag-creation operation |
| 0 | Isolated Neon development branch | DONE & VERIFIED | Neon `v2-dev` / `br-square-fire-ba5g5k9a`; parent production; no v2 writes |
| 0 | v1 audit document | DONE & VERIFIED | `docs/v1-audit.md` |
| 0 | Future-session instructions | DONE & VERIFIED | `AGENTS.md` |
| 0 | Architecture, security, decisions, owner keys and acceptance docs | DONE & VERIFIED | `docs/ARCHITECTURE.md`, `docs/SECURITY.md`, `docs/DECISIONS.md`, `docs/OWNER_TODO.md`, `docs/ACCEPTANCE.md` |
| 0 | Setup guide | DONE (UNVERIFIED) | `docs/SETUP.md` |
| 0 | Build brief and PRD verbatim | NOT STARTED | Must be committed in full before phase 0 closes |
| 0 | Next.js App Router + TypeScript scaffold | DONE (UNVERIFIED) | Next package manifest, app layout, welcome route, TypeScript and Next config |
| 0 | Black/white/red design foundation | DONE (UNVERIFIED) | `src/app/globals.css`, initial welcome route |
| 0 | PWA manifest and offline shell | DONE (UNVERIFIED) | `src/app/manifest.ts`, `public/sw.js`, offline route; service-worker registration and real icons still need completion |
| 0 | CI pipeline | DONE (UNVERIFIED) | `.github/workflows/ci.yml`; no successful CI run observed |
| 0 | Prisma relational schema | DONE (UNVERIFIED) | `prisma/schema.prisma` contains 46 models / 11 enums; schema validation and relation/index audit not run |
| 0 | Reference seed data | DONE (UNVERIFIED) | `prisma/seed.ts` defines ranks, plans, 120 identity names and 8 beta Scenes; seed has not run |
| 0 | 120 original SVG icon artworks | NOT STARTED | Catalogue paths are defined; artwork files and admin gallery remain to be built |
| 0 | Shared component library and full app shell | NOT STARTED | — |
| 0 | Preview deployment and browser verification | BLOCKED | Vercel deployment API quota reached: more than 100 deployments/day; retry after 24 hours |
| 0 | Local install/typecheck/lint/test/build | BLOCKED | Runtime cannot resolve github.com; direct clone/install not available |

## Vercel deployment evidence

- V2 Preview attempts failed before dependency installation due inherited v1 npm overrides: `EOVERRIDE` — `Override for zod@^4.1.12 conflicts with direct dependency`.
- Removed the v1 `overrides` block from v2 `package.json`.
- A fresh deployment was attempted but Vercel returned HTTP 402: deployment API quota `api-deployments-free-per-day` exceeded; retry after 24 hours. No production deployment was made.
- Latest Vercel deployment state inspected was ERROR for the earlier pre-fix commit; the dependency override fix has not yet received a fresh deployment.

## Safety evidence

- Production branch `br-jolly-term-ba4i3ynt` was queried read-only only.
- Production counts observed: 3 `public.user_profiles`, 4 `neon_auth.user`, 1 `public.artist_profiles`.
- No production database writes, migrations, seeds, resets, environment changes, DNS changes or cutover actions were performed.
- V2 Neon branch `br-square-fire-ba5g5k9a` was created from production; no migration or seed has been run.
- No production domain or Vercel production configuration was changed.
- Direct terminal network access to GitHub is unavailable in this runtime; GitHub repository writes are performed through the connected GitHub integration.
