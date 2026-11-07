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
| 0 | Product requirements reference | DONE (UNVERIFIED) | `docs/NOCHALANT_CLUB_PRD.md` committed; needs exact verbatim comparison against supplied PRD |
| 0 | Next.js App Router + TypeScript scaffold | DONE (UNVERIFIED) | Next package manifest, app layout, welcome route, TypeScript and Next config |
| 0 | Black/white/red design foundation | DONE (UNVERIFIED) | `src/app/globals.css`; final red-token override committed in `5acfbd5` |
| 0 | PWA manifest and offline shell | DONE (UNVERIFIED) | `src/app/manifest.ts`, `public/sw.js`, `/offline`, registered client component and original SVG mark; raster maskable icon variants and install QA remain |
| 0 | CI pipeline | DONE (UNVERIFIED) | `.github/workflows/ci.yml`; no successful CI run observed |
| 0 | Prisma relational schema | DONE (UNVERIFIED) | `prisma/schema.prisma` contains 46 models / 11 enums; schema validation and relation/index audit not run |
| 0 | Reference seed data | DONE (UNVERIFIED) | `prisma/seed.ts` defines ranks, plans, 120 identity names and 8 beta Scenes; seed has not run |
| 0 | 120 original SVG icon artworks | NOT STARTED | Catalogue paths are defined; artwork files and admin gallery remain to be built |
| 0 | Reference-matched mobile UI foundation | DONE (UNVERIFIED) | Responsive mobile shell, onboarding, feed, navigation and supporting screen styles; red brand correction committed, browser QA pending |
| 0 | Core reference screen routes | DONE (UNVERIFIED) | `/join`, `/club`, `/discover`, `/chats`, `/chats/lagos-night-crew`, `/listening-room`, `/listening-room/submit`, `/my-club`, `/club/create` |\n| 0 | Real account, feed, messaging, media and moderation APIs | NOT STARTED | Current UI interactions are local previews; no production publishing, chat delivery or upload claims |\n| 0 | Preview deployment and browser verification | BLOCKED | Vercel previously failed at npm install with EOVERRIDE; fix committed, but new deployment/build still needs verification |

| 0 | Honest member sign-in holding screen | DONE (UNVERIFIED) | `/sign-in`; clearly explains authentication is not active and does not collect credentials |
| 0 | Membership tier comparison screen | DONE (UNVERIFIED) | `/my-club/membership`; displays tiers and explicitly states checkout is not active |

| 0 | Member profile editor preview | DONE (UNVERIFIED) | `/my-club/edit`; display name, username, bio, city and discoverability controls; explicitly local preview only |
| 0 | Scene discovery search and filters | DONE (UNVERIFIED) | `/discover`; category filters, text search, empty state and local join toggles; persistence not connected |

| 0 | Local install/typecheck/lint/test/build | BLOCKED | Runtime cannot resolve github.com; direct clone/install not available |

## Vercel deployment evidence

- Latest Vercel build log identified the precise cause: root `package.json` retained v1 overrides pinning Better Auth packages and `zod` to `4.6.7`, conflicting with the v2 direct dependency range `zod: ^4.1.12` (`EOVERRIDE`).
- Commit `542e3ae7d839bbd2489835e411b54f572079104b` removes the obsolete v1 overrides block entirely; v2 dependencies now resolve from the v2 manifest without the stale pins.
- Fix is committed to `v2`; install, typecheck, tests and Preview build remain unverified until Vercel runs successfully.
- Reference-led screen routes and initial UI interactions have been committed to `v2`; they have not yet passed a build or browser QA.\n- Posting, track submission, likes, chat messages and profile setup are UI previews only and are not persisted to the database.\n- The original build brief and PRD files were not found at the expected `docs/BUILD_BRIEF.md` and `docs/PRD.md` paths; product acceptance details must be restored before declaring the full PRD complete.\n- No production deployment was made.

## Safety evidence

- Production branch `br-jolly-term-ba4i3ynt` was queried read-only only.
- Production counts observed: 3 `public.user_profiles`, 4 `neon_auth.user`, 1 `public.artist_profiles`.
- No production database writes, migrations, seeds, resets, environment changes, DNS changes or cutover actions were performed.
- V2 Neon branch `br-square-fire-ba5g5k9a` was created from production; no migration or seed has been run.
- No production domain or Vercel production configuration was changed.
- Direct terminal network access to GitHub is unavailable in this runtime; GitHub repository writes are performed through the connected GitHub integration.
