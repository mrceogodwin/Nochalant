# Nochalant Club v2 — Security baseline

- Enforce 18+ at registration and on every protected account workflow. Beta assurance is self-declaration; hard-block under-18 responses. Never expose DOB.
- Hash passwords with argon2id. Require email verification. Use secure, httpOnly, SameSite cookies and revocable server-side sessions.
- Centralize authorization. Never trust client role/owner/visibility flags.
- Scope all private Scene, Squad, DM, event and notification queries by membership/permission.
- Use DTO allowlists to prevent private profile fields and email leakage.
- Rate-limit auth, messaging, reactions, submissions, uploads and sensitive actions.
- Validate and canonicalize external music URLs; do not host third-party music.
- Verify Paystack webhooks against raw request bytes with HMAC-SHA512; idempotently process event/reference inside a database transaction.
- Use signed short-lived media URLs and validate uploaded content.
- Voice rooms are not recorded by default; token issuance and host controls are server-authorized.
- Audit every privileged administrative action.
- Provide block, mute, report, appeal, export and deletion workflows.
- Design for applicable Nigerian data protection obligations, including NDPA 2023; legal review is required and no legal compliance claim is made.
- Never run v2 migration, seed or destructive command on production.
