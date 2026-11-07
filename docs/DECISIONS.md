# Nochalant Club v2 — Decisions

## 2026-11-07

1. **Clean rebuild:** v2 is a new product implementation. No v1 UI, route, component, copy, navigation, theme or feature implementation is reused.
2. **Preservation:** `legacy/v1` and `v2` branches are created from the inspected `main` head. A `v1-archive` tag was not created because the connected GitHub toolset does not expose tag creation.
3. **Production isolation:** Production domain and deployment configuration remain unchanged. All v2 database work is restricted to Neon branch `v2-dev`.
4. **Database baseline:** `v2-dev` was branched from production HEAD to preserve the Neon Auth provider baseline while keeping all v2 writes isolated. No migration or seed has been applied.
5. **Auth:** Use Auth.js with server-side password hashing and revocable sessions as specified in the build brief. Do not rely on the existing v1 Neon Auth client flow for v2.
6. **Realtime provider:** Choose Ably for managed realtime delivery. Durable messages/events are committed to PostgreSQL before publication; presence/typing use Ably.
7. **Analytics:** Choose Plausible for privacy-conscious product analytics; do not load analytics before consent where consent is required.
8. **Icon artwork:** 120 icons will be original SVG assets generated from a common 64×64 construction grid; emoji are not acceptable substitutes.
9. **Age assurance:** Beta uses 18+ self-declaration with a hard under-18 block; date of birth is never public.
10. **Membership:** Hybrid plans remain admin-configurable. Prices are not hard-coded in product code.
11. **Nightlife safety:** No live location by default; no private event address exposure without explicit host permission.
12. **No fake production data:** Any seeded fixtures are confined to v2-dev and explicitly labelled as development seed data.

## Open owner-key dependencies

See `docs/OWNER_TODO.md`. Third-party integrations must be implemented behind adapters and marked NEEDS OWNER KEYS until credentials are configured.
