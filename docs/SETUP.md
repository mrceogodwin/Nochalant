# Nochalant Club v2 — Setup

## Local prerequisites
- Node.js 22 LTS or newer compatible with the pinned Next.js release.
- npm.
- Neon PostgreSQL branch `v2-dev` only.

## Environment
Copy `.env.example` to `.env.local`. Populate server-only credentials. During development, `DATABASE_URL` and `DIRECT_URL` must point to Neon branch `v2-dev`, never production. Use pooled connection for runtime and direct connection for Prisma migrations.

## Commands
```bash
npm ci
npm run prisma:generate
npm run typecheck
npm run lint
npm run test
npm run build
npm run dev
```

## Vercel Preview
Connect the `v2` branch to the existing Nochalant Vercel project as Preview only. Configure branch-scoped Preview variables for `v2`; do not modify Production variables or custom domains. Preview must be protected and use test credentials.

## Third-party keys
See `docs/OWNER_TODO.md` for the provider, exact variables and setup state.

## Database safety
Before every database operation, identify the Neon project, branch ID and database. Migrations and seeds may run only against `v2-dev`. Never run reset, drop, truncate or production migration commands.

## Tests
CI runs typecheck, lint, Vitest and Next.js build. Playwright acceptance flows are required before launch. Do not mark a test passed unless it has actually run.
