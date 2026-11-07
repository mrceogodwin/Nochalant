# Owner setup — Nochalant Club v2

No credentials are required for the read-only audit or repository foundation.

Add credentials only through Vercel project environment variables or the relevant provider dashboard; never paste secrets into chat or commit them.

| Integration | Required owner setup | State |
|---|---|---|
| Neon | Use isolated `v2-dev` connection strings for `DATABASE_URL` (pooled) and `DIRECT_URL` (direct) | NEEDS OWNER KEYS / secure env configuration |
| Auth.js | Generate and configure `AUTH_SECRET`; configure verified email sender | NEEDS OWNER KEYS |
| Resend | API key and verified sending domain | NEEDS OWNER KEYS |
| Ably | API key with server-side publish capability | NEEDS OWNER KEYS |
| LiveKit | Server URL, API key and API secret | NEEDS OWNER KEYS |
| Paystack | Test secret key and webhook secret; NGN account setup | NEEDS OWNER KEYS |
| Object storage | S3-compatible endpoint, bucket, access key and secret (R2 or S3) | NEEDS OWNER KEYS |
| Upstash Redis | REST URL and token | NEEDS OWNER KEYS |
| Sentry | Project DSN and auth token for source maps if enabled | NEEDS OWNER KEYS |
| Plausible | Site/domain configuration | NEEDS OWNER CONFIGURATION |
| Web Push | VAPID public/private keys and subject | NEEDS OWNER KEYS |

Before any provider integration is enabled in Preview, add only Preview-scoped variables for the v2 branch and use test/sandbox credentials. Never copy production secrets into v2.
