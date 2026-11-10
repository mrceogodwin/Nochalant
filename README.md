# Nochalant

Your people. Your scene. Your rules.

Nochalant is a mobile-first social club: live Scenes, group communities, chats, gifts, a wallet, a leaderboard, events, games, and Nochalant Club Pro. The interface is black with orange-to-red accents. This app is a Next.js site on Vercel, with its own `social` schema in the existing Neon Postgres project. Older tables in `public` are left in place.

Support and the seeded owner account use `fluxbeatempire@gmail.com`.

## Run locally

```bash
npm install
cp .env.example .env.local
# fill DATABASE_URL, AUTH_SECRET, and SEED_ADMIN_PASSWORD
npm run db:migrate
npm run db:seed
npm run dev
```

Open http://localhost:3000. Sign up with email and password, or sign in as the owner after seeding.

`npm run db:seed` loads the club the first time. Run `node scripts/seed.mjs --reset` only when you mean to wipe the `social` schema and seed it again. That does not touch the older tables.

## Scripts

- `npm run dev` — local app
- `npm run build` — production build
- `npm test` — naira formatting, Whot rules, and chess move generation
- `npm run db:migrate` — create the `social` schema
- `npm run db:seed` — seed scenes, groups, chats, gifts, and the owner

## What works

- Email and password sign-up, sign-in, sign-out, and profile onboarding (display name, photo, bio, at least three interests)
- Google sign-in when `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set
- Home greeting uses the signed-in member’s name and avatar
- Discover, live Scenes, scene chat, speak requests, groups, posts, comments, follows, and the chat inbox
- Wallet balance, gifts between members, leaderboard, events with reminders, and profile tools
- Whot, chess (Checkmate), and Ludo against a bot
- Pro, wallet top-ups and gift purchases. Bachs is the default provider. Without keys these run in test mode. Paystack stays available with `PAYMENT_PROVIDER=paystack`

## Payments

`PAYMENT_PROVIDER=bachs` (the default) or `paystack`. If the chosen provider has no key, checkout stays in test mode and a button on the confirmation page fulfils the order locally.

Bachs amounts are decimal strings with an ISO currency, for example `"2999.00"` and `NGN`, never kobo. Sandbox is `https://sandbox-api.bachs.io` with an `sk_sandbox_` key. Production is `https://api.bachs.io` with an `sk_live_` key. Leaving `BACHS_API_BASE` empty picks that URL from the key prefix.

Pro plans are recurring products created through checkout (there is no direct create-subscription call):

- Monthly, ₦2,999, every month
- Quarterly, ₦7,999, every 3 months
- Yearly, ₦26,999, every year

Wallet top-ups and gift purchases are one-time checkouts. Pro, wallet credit and gifts are granted only from a verified `collection.succeeded` webhook. The success redirect does not fulfil the order.

Register this HTTPS URL in the Bachs dashboard, subscribed at least to `collection.succeeded`:

`https://nochalant.vercel.app/api/bachs/webhook`

Copy that endpoint’s signing secret into `BACHS_WEBHOOK_SECRET`. During a secret rotation, keep the old one in `BACHS_WEBHOOK_SECRET_PREVIOUS`. Bachs refuses `localhost` success URLs, including in the sandbox, so `NEXT_PUBLIC_APP_URL` must be a public https origin.

Withdrawals use Bachs Connect: a recipient account, an NGN transfer, then a payout to a Nigerian bank (`POST /v1/payouts`). That needs the platform `connect` capability and an available NGN balance. Bachs documents subscriptions as USD-card-only today; the products are still priced in NGN, and a sandbox rejection is shown on the checkout screen.

## Stubbed until credentials exist

| Need | Variables | Behaviour without them |
| --- | --- | --- |
| Google sign-in | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Button explains that the keys are missing. Redirect URI: `{APP_URL}/api/auth/google/callback` |
| Apple sign-in | `APPLE_CLIENT_ID`, `APPLE_TEAM_ID`, `APPLE_KEY_ID`, `APPLE_PRIVATE_KEY` | Button is on the sign-up screen. Apple’s token exchange is not finished; email sign-up is the working path |
| Bachs checkout, gifts and NGN bank payouts | `BACHS_API_KEY`, `BACHS_WEBHOOK_SECRET` | Test checkout fulfils locally. Optional: `BACHS_API_BASE`, `BACHS_WEBHOOK_SECRET_PREVIOUS`, `BACHS_PRODUCT_PRO_MONTHLY`, `BACHS_PRODUCT_PRO_QUARTERLY`, `BACHS_PRODUCT_PRO_YEARLY` |
| Paystack, only when `PAYMENT_PROVIDER=paystack` | `PAYSTACK_SECRET_KEY`, `PAYSTACK_PUBLIC_KEY` | Test checkout without the secret. With it, checkout opens Paystack and `POST /api/paystack/webhook` confirms `charge.success` |
| Live voice | `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET` | Speak turns the microphone on for this device only. Other people do not hear it. `GET /api/livekit` reports whether LiveKit is configured |
| Password reset email | a mail provider | The forgot-password screen points people to fluxbeatempire@gmail.com |
| Multiplayer games | a game server | Whot, chess, and Ludo are local versus a bot |

Also set `NEXT_PUBLIC_APP_URL` to the public origin, for example `https://nochalant.vercel.app`, so Paystack can redirect back.

## Data

The database belongs to the Neon account **squadempireng@gmail.com** (organization `Mr`, `org-red-tooth-36428852`).

- Project: `nochalant` (`fancy-hall-40653071`)
- Database: `neondb`
- Schema: `social` (older tables in `public` are not used by this app)

`DATABASE_URL` must be that project’s pooled connection string from the Neon console for squadempireng@gmail.com. Do not point the app at a project from another Neon account. This environment can reach that project, and `npm run db:migrate` plus `npm run db:seed` have already been applied there.
