# Nochalant Club v2 — Architecture

## Runtime

- Next.js App Router on Vercel.
- React + strict TypeScript; Tailwind CSS; Radix primitives wrapped in a local component system; Motion for reduced-motion-aware transitions.
- Prisma ORM with Neon PostgreSQL. Runtime uses pooled connection; migrations use direct connection.
- Auth.js credentials authentication, argon2id password hashing, verified email, secure httpOnly cookies and server-revocable sessions.
- Ably for realtime fanout/presence/typing; PostgreSQL is the durable source of truth.
- LiveKit for voice rooms; room tokens are short-lived and permission-scoped.
- S3-compatible object storage with signed URLs.
- Paystack for NGN payments; server-side verification and idempotent signed webhooks.
- Resend, Web Push, Upstash Redis, Sentry and Plausible.

## Security boundaries

All server actions, route handlers and data access use a central authorization policy. Every private query is scoped to the authenticated user and the relevant Scene/Squad membership. Use explicit DTO allowlists. Persist durable state before publishing realtime events. Payments and moderation are never optimistic.

## Environments

- Production database: read-only for v2 development; no migrations or seeds.
- Development database: Neon `v2-dev` branch only.
- Vercel: v2 Preview deployments only until explicit cutover approval.
- Secrets: server-only environment variables; no secrets in Git.

## Data lifecycle

Use Prisma migrations committed to Git. Seed only reference catalogues and explicitly labelled development fixtures on v2-dev. Keep migration history and rollback notes with every schema change.
