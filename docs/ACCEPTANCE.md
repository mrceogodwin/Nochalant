# Nochalant Club v2 — Acceptance

| Criterion | Verification | Test | Result |
|---|---|---|---|
| Adult registration and secure sign-in | Playwright registration, email verification and sign-in | E2E | NOT STARTED |
| Onboarding and Club ID | Complete onboarding and inspect persisted member profile | E2E | NOT STARTED |
| Discover and join public Scene | Join as authenticated member | E2E | NOT STARTED |
| Request private Scene access | Non-member requests; member cannot see private content until approved | E2E | NOT STARTED |
| Create Scene with permission | Create and verify owner role | E2E | NOT STARTED |
| Create Squad | Create Squad under permitted context | E2E | NOT STARTED |
| Squad membership isolation | Attempt cross-Squad reads and writes | Security E2E | NOT STARTED |
| Real-time messages | Persist then deliver through Ably | E2E | NOT STARTED |
| Report and block | Member submits report and blocks target | E2E | NOT STARTED |
| Moderator resolves report | RBAC, action and audit log verification | E2E | NOT STARTED |
| Icon selection and unlock | Catalogue selection and unlock conditions | Unit/E2E | NOT STARTED |
| Reputation anti-abuse | Daily caps, idempotency and reversal | Unit/Integration | NOT STARTED |
| Server-verified payment | Paystack test transaction and signed webhook | Integration/E2E | NOT STARTED |
| Membership entitlement | Verified payment updates entitlement transactionally | E2E | NOT STARTED |
| Private information protection | DTO and cross-user/private-content leakage tests | Security E2E | NOT STARTED |
| Mobile and desktop | Playwright viewport matrix | E2E | NOT STARTED |
| Network/payment recovery | Retry, idempotency and reconciliation tests | Integration | NOT STARTED |
| Admin auditability | Privileged actions create immutable audit records | Integration/E2E | NOT STARTED |

Voice Rooms, Listening Room, artist workflows and paid features require additional dedicated acceptance suites before launch.
