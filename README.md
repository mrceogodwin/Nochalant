# Nochalant

Nochalant is a Nigerian culture, entertainment, nightlife and events platform.

## Product rules
- Members can send free daily submissions.
- Every submission enters an editorial queue; the target turnaround is a few hours, not automatic publication.
- A member can create only one free submission per Lagos calendar day.
- Duplicate content is blocked with a content fingerprint.
- Optional carousel placement costs ₦5,999 and activates only after server-side payment verification.
- Agenda events are editorially managed.
- Editorial workflow: pending → in_review → approved → scheduled → published (or rejected).

## Repository
- src/ contains the Vite/React frontend.
- database/migrations/001_initial_schema.sql defines the initial PostgreSQL data model.
- Homepage stories and events are placeholders until connected to editorial data.

## Backend and preview setup
- The browser uses Neon Managed Auth through Nochalant's same-origin `/api/auth/*` proxy. Do not configure a public `VITE_NEON_AUTH_URL` for this flow.
- Server-side Vercel variables required for authenticated API routes: `NEON_AUTH_BASE_URL`, `NEON_AUTH_JWKS_URL`, and `DATABASE_URL_POOLED` (or `DATABASE_URL` as a fallback).
- For preview testing, scope these variables to the intended Git branch and connect them only to an isolated Neon test branch. Never copy production database credentials into a preview.
- The proxy uses the preview deployment origin for non-production requests. Ensure the Neon Auth trusted-origin configuration permits the exact preview origin being tested.
- After configuring preview variables, redeploy the preview and verify registration, login, session restoration, logout, and protected API requests before considering authentication production-ready.
- Never expose database credentials or Neon Auth server settings in Vite client variables.

## Remaining backend/product work
1. Ensure server-side submission endpoints derive the member from a verified session, calculate the normalized content fingerprint, and rely on database unique constraints for race-safe daily and duplicate protection.
2. Add Paystack or Flutterwave checkout and verify signed webhooks server-side before marking payments successful or activating carousel placements.
3. Restrict editorial endpoints to editor/admin roles and record moderation actions in `editorial_audit_log`.

Never expose database credentials or payment secrets in Vite client variables. Never mark a payment successful from a browser redirect alone.