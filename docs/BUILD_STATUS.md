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

| 0 | Scene detail preview route | DONE (UNVERIFIED) | `/discover/scenes/[slug]`; curated preview information and community rules; no live membership data |
| 0 | Scene creation preview | DONE (UNVERIFIED) | `/discover/create`; name, description, category, visibility and rules form; no persistence |
| 0 | Squads directory and creation preview | DONE (UNVERIFIED) | `/squads`, `/squads/create`; illustrative directory and creation form; no real groups created |
| 0 | Discover community navigation | DONE (UNVERIFIED) | Scene cards link to detail routes; links to create Scene and explore Squads |

| 0 | Interactive social feed preview | DONE (UNVERIFIED) | `/club`; feed tabs, local likes, saved state, comment composer, poll voting and notices; no persistence |
| 0 | Post composer preview | DONE (UNVERIFIED) | `/club/create`; Post/Scene/Poll modes, poll options, audience selector and validation; no publishing |
| 0 | Notifications preview | DONE (UNVERIFIED) | `/notifications`; illustrative activity list, clearly labelled sample content |

| 0 | Messaging inbox redesign | DONE (UNVERIFIED) | `/chats`; search, All/Unread/Direct/Group filters, unread indicators and shortcuts |
| 0 | Direct message screens | DONE (UNVERIFIED) | `/chats/mira`, `/chats/jude`; local message composer and reactions, no delivery or persistence |
| 0 | Message requests | DONE (UNVERIFIED) | `/chats/requests`; accept/delete preview actions and privacy explanation |
| 0 | Voice room discovery | DONE (UNVERIFIED) | `/chats/voice-rooms`; live/upcoming room cards and local join state; no microphone or audio connection |
| 0 | Messaging visual system | DONE (UNVERIFIED) | Inbox, direct threads, request cards, voice rooms and responsive styling in `globals.css` |

| 0 | Squad group chat interaction preview | DONE (UNVERIFIED) | `/chats/lagos-night-crew`; Chat/Voice Room/Members tabs, local replies, reactions and pinned-message detail |
| 0 | Squad conversation details | DONE (UNVERIFIED) | `/chats/lagos-night-crew/info`; mute toggle preview, invite and report entry points, safety notice |

| 0 | Interactive Scene community hub | DONE (UNVERIFIED) | `/discover/scenes/[slug]`; Overview, Discussions, Channels, Members and About tabs; local discussion composer |
| 0 | Scene channel directory | DONE (UNVERIFIED) | `/discover/scenes/[slug]/channels`; channel directory and descriptions |
| 0 | Scene channel discussion | DONE (UNVERIFIED) | `/discover/scenes/[slug]/channels/[channel]`; message composer and discussion preview |
| 0 | Scene founder management | DONE (UNVERIFIED) | `/discover/scenes/[slug]/manage`; channel, roles, moderation, invitations and visibility entry points |

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


| 0 | Member safety centre preview | DONE (UNVERIFIED) | `/safety`; safety principles, report entry, quiet-mode preview and blocked-member navigation; no persistence or enforcement |
| 0 | Report submission preview | DONE (UNVERIFIED) | `/safety/report`; target type, reason and details form; intentionally does not transmit or save reports |
| 0 | Blocked members screen | DONE (UNVERIFIED) | `/my-club/blocked`; empty state for future authenticated block list; no live block data |
| 0 | Moderation case queue preview | DONE (UNVERIFIED) | `/admin/moderation`; illustrative queue, status filters and severity indicators; route is not admin-auth protected |
| 0 | Moderation case review preview | DONE (UNVERIFIED) | `/admin/moderation/[id]`; schema-aligned action choices, rationale field and explicit non-persistence notice |
| 0 | Appeals queue preview | DONE (UNVERIFIED) | `/admin/moderation/appeals`; illustrative appeal entry; no reviewer workflow or persistence |
| 0 | Safety and moderation styling | DONE (UNVERIFIED) | Appended responsive black/white/red styles in `src/app/globals.css`; browser QA pending |

## Safety and moderation implementation notes

- Prisma schema already defines `ContentReport`, `ModerationCase`, `ModerationAction`, `Appeal`, `UserBlock` and `AuditLog`; the new screens use their existing concepts and action enum vocabulary.
- These routes are UI previews only. No API handlers, authentication guards, database writes, report delivery, blocking enforcement, account restrictions or audit-log writes were added.
- The admin preview routes are not protected. Do not use them for real moderation or expose them as an operational admin tool before server-side RBAC is implemented.
- Build, typecheck, lint, tests and browser verification remain unverified while Vercel's deployment quota is exhausted.

- Safety centre is linked from the member profile, and the Squad details report entry now opens the report form.
- Corrected the Scene management client route's missing React `use` import discovered during source review; this is a source-level correction, not a verified build result.


## Backend foundation — 2026-11-07

- Added a shared Prisma client module with Next.js development hot-reload reuse. It does not run migrations, seed data or issue database queries by itself.
- Added server-only environment access helpers that fail at point of use and do not expose secret values. Build-time static rendering is not forced to have Preview credentials.
- Authentication, email verification, registration, authorization guards and database persistence remain NOT STARTED. These helpers are infrastructure only.
- No database connection was made; no Neon branch was changed. No build, typecheck or tests were run in this environment.


- Added Argon2id password hashing and verification helpers with explicit input bounds. This is a utility only; no registration, login endpoint, session creation or email verification flow is active.


## Authentication foundation — 2026-11-07

- Added Auth.js v5 Credentials provider configuration and App Router route handlers.
- Credential lookup normalizes email and rejects inactive, unverified, or non-adult accounts before password verification.
- Password verification uses the Argon2id helper. Successful sign-in creates a revocable server-side UserSession row; subsequent JWT validation checks that row and rechecks account status, email verification and 18+ assurance.
- Sign-out revokes the corresponding server-side session record.
- Added a server-only requireMember() guard for protected server components and handlers.
- Added Auth.js TypeScript session/JWT augmentation.
- Authentication is NOT READY FOR PUBLIC USE: registration, email verification delivery/token lifecycle, password recovery, login UI, rate limiting/abuse controls, admin role/RBAC and end-to-end tests remain outstanding. The existing /sign-in holding screen remains intentionally honest.
- No database connection, schema migration, seed, Vercel deployment or production change was made. Auth.js/Prisma type compatibility and runtime behaviour have not been tested; build/typecheck remain unverified.


## Registration and email verification foundation — 2026-11-07

- Added Prisma models for one-time email verification tokens and versioned Terms, Privacy and Community Guidelines acceptance. Schema changes are committed only; no migration has been generated or applied.
- Added a registration API that validates display name, username, email, 12–128 character password, explicit 18+ declaration, minimum three interests and policy acceptance.
- Registration hashes passwords with Argon2id, stores the 18+ self-declaration and accepted policy version identifiers, creates a profile/Club ID and selected interests, and stores only a SHA-256 hash of the one-time verification token.
- Added fail-closed Upstash sliding-window rate limiting. Registration returns unavailable until Redis credentials are configured; it does not silently run without rate limiting.
- Added Resend email delivery using the configured AUTH_URL as the verification origin. Registration remains unavailable until Resend, sender and origin settings are configured.
- Added a one-time verification endpoint. Valid unexpired tokens mark the account email as verified and are deleted; expired tokens are invalidated.
- Connected the final onboarding step to the registration endpoint and added a verification result notice on the sign-in holding screen.
- No credentials or API keys were added to the repository. No database was contacted, no migration or seed was run, and no deployment was attempted.
- NOT READY FOR PUBLIC REGISTRATION: migration, terms/privacy/guidelines publication and legal review, resend-verification flow, password reset, automated abuse controls, end-to-end tests and verified Preview build remain outstanding.
- TypeScript, Prisma schema validation, build and browser tests have not been run. All implementation status remains unverified pending CI/Preview.

- Final review corrections: onboarding now displays the API's generic registration response verbatim, and the verification endpoint distinguishes an invalid token from an expired token. These are source-level fixes only; runtime validation remains pending.


## Password recovery — 2026-11-07

- Added a password-reset token model. The schema change is committed but not migrated.
- Added a privacy-preserving recovery request endpoint. It returns the same success response whether an eligible verified account exists or not.
- Reset tokens are cryptographically random, stored as SHA-256 hashes, expire after 30 minutes and are emailed through the configured Resend sender/origin.
- Added a reset confirmation endpoint with Argon2id hashing, fail-closed Upstash rate limiting, one-time token consumption and revocation of all active sessions after a successful password change.
- Added /forgot-password and /reset-password screens and linked recovery from /sign-in.
- Hardened token consumption so concurrent submissions cannot reuse the same reset token.
- Password recovery remains unavailable until the isolated V2 schema is migrated and Preview credentials (Neon v2-dev, Upstash, Resend, sender and AUTH_URL) are configured.
- No DB migration, database write, deployment, or production change occurred. Build, typecheck, Prisma validation and end-to-end behaviour remain unverified.
