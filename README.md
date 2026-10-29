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

## Backend setup still required
1. Provision a Neon project for Nochalant and configure DATABASE_URL as a server-side Vercel environment variable.
2. Configure an authentication provider and store its immutable user ID in user_profiles.auth_user_id. Never trust client-supplied roles or user IDs.
3. Implement server-side submission endpoints that derive the member from a verified session, calculate the normalized content fingerprint, and rely on database unique constraints for race-safe daily and duplicate protection.
4. Add Paystack or Flutterwave checkout and verify signed webhooks server-side before marking payments successful or activating carousel placements.
5. Restrict editorial endpoints to editor/admin roles and record moderation actions in editorial_audit_log.

Never expose database credentials or payment secrets in Vite client variables. Never mark a payment successful from a browser redirect alone.