# Nochalant Club v2 — Build status

Last updated: 2026-11-07

| Phase | Feature | State | Evidence |
|---|---|---|---|
| 0 | Read-only v1 repository, hosting and database audit | DONE & VERIFIED | `docs/v1-audit.md`; GitHub main head, Vercel project metadata and Neon read-only queries inspected |
| 0 | Preserve v1 branch | DONE & VERIFIED | GitHub branch `legacy/v1` created from `main` |
| 0 | Create v2 branch | DONE & VERIFIED | GitHub branch `v2` created from `main` |
| 0 | v1-archive Git tag | BLOCKED | Connected GitHub tools do not expose tag creation |
| 0 | Isolated Neon development branch | DONE & VERIFIED | Neon `v2-dev`, branch ID `br-square-fire-ba5g5k9a`; parent is production; no v2 writes |
| 0 | Commit build brief and PRD verbatim | NOT STARTED | Source documents still need to be committed |
| 0 | Next.js scaffold and strict TypeScript | NOT STARTED | — |
| 0 | Full Prisma schema and migrations | NOT STARTED | No schema changes have been run |
| 0 | Design system, app shell and PWA | NOT STARTED | — |
| 0 | CI and automated tests | NOT STARTED | — |

## Safety evidence

- Production branch `br-jolly-term-ba4i3ynt` was queried read-only only.
- Production counts observed: 3 `public.user_profiles`, 4 `neon_auth.user`, 1 `public.artist_profiles`.
- No production database writes, migrations, seeds, resets, env changes, DNS changes or cutover actions were performed.
- Vercel latest deployment metadata is READY; this does not constitute a v2 deployment.
