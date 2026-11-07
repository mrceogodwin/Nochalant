# Nochalant Club v2 — Build status

Last updated: 2026-11-07

| Phase | Feature | State | Evidence |
|---|---|---|---|
| 0 | Read-only v1 repository, hosting and database audit | DONE & VERIFIED | `docs/v1-audit.md`; GitHub, Vercel metadata and Neon read-only queries |
| 0 | Preserve v1 branch | DONE & VERIFIED | GitHub branch `legacy/v1` created from main |
| 0 | Create v2 branch | DONE & VERIFIED | GitHub branch `v2` created from main |
| 0 | v1-archive Git tag | BLOCKED | GitHub connector does not expose tag creation |
| 0 | Isolated Neon development branch | DONE & VERIFIED | `v2-dev` / `br-square-fire-ba5g5k9a`, parent production; created with zero v2 writes |
| 0 | v1 audit document | DONE & VERIFIED | `docs/v1-audit.md` |
| 0 | Future-session instructions | DONE & VERIFIED | `AGENTS.md` |
| 0 | Architecture, security, decisions, owner keys and acceptance docs | DONE & VERIFIED | `docs/ARCHITECTURE.md`, `docs/SECURITY.md`, `docs/DECISIONS.md`, `docs/OWNER_TODO.md`, `docs/ACCEPTANCE.md` |
| 0 | Build brief and PRD verbatim | NOT STARTED | Must be committed in full before phase 0 can be closed |
| 0 | Next.js App Router + TypeScript scaffold | DONE (UNVERIFIED) | `package.json`, `src/app/layout.tsx`, `src/app/page.tsx`, `next.config.ts`, `tsconfig.json`; no install/build possible yet |
| 0 | Black/white/red design foundation and welcome shell | DONE (UNVERIFIED) | `src/app/globals.css`, welcome route |
| 0 | PWA manifest and offline shell | DONE (UNVERIFIED) | `src/app/manifest.ts`, `public/sw.js`, offline route |
| 0 | CI pipeline | DONE (UNVERIFIED) | `.github/workflows/ci.yml`; no CI run observed |
| 0 | Full Prisma schema, migrations and seed catalogue | NOT STARTED | No database writes or migrations run |
| 0 | Shared component library and app navigation | NOT STARTED | — |
| 0 | Preview deployment and browser verification | NOT STARTED | Vercel project production remains untouched |

## Safety evidence

- Production branch `br-jolly-term-ba4i3ynt` was queried read-only only.
- Production counts observed: 3 `public.user_profiles`, 4 `neon_auth.user`, 1 `public.artist_profiles`.
- No production database writes, migrations, seeds, resets, environment changes, DNS changes or cutover actions were performed.
- The Neon connection string retrieval operation was used for the newly created `v2-dev` branch; its secret value is not included in repository files or this status document.
- Direct terminal network access to GitHub is unavailable in this runtime. GitHub repository writes are performed through the connected GitHub integration.
