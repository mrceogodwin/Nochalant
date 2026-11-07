# Instructions for future Nochalant Club v2 sessions

Before making any change, read `docs/BUILD_BRIEF.md`, `docs/PRD.md`, `docs/DECISIONS.md`, and `docs/BUILD_STATUS.md`.

- V2 is a clean rebuild. Do not reuse v1 UI, routes, components, copy, navigation, theme or feature code.
- Work only on branch `v2`; preserve `main` and `legacy/v1`.
- Use only the isolated Neon `v2-dev` branch for schema changes, migrations and seeds. Never run writes against production.
- Do not touch production domains, DNS, production environment variables or production deployments until the owner explicitly writes `cutover approved`.
- Neon PostgreSQL only. No Supabase.
- Keep strict TypeScript, server-side authorization, privacy isolation, audit logging and test coverage.
- Update `docs/BUILD_STATUS.md` with every implementation commit. Record actual test/deployment evidence only.
- Read and follow `docs/DECISIONS.md` when a PRD ambiguity occurs. Prefer the safer, more private interpretation.
- Never commit secrets or expose connection strings. Keep `.env.example` complete and secret-free.
- Do not claim a feature is complete, tested or deployed unless verified.
