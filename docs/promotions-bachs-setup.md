# Nochalant Promotions — Bachs setup

The Promotions module uses Bachs hosted Checkout. The server only marks a campaign paid after a signed Bachs webhook confirms the exact amount and currency.

## Vercel environment variables

Add these as **encrypted Sensitive** environment variables for Production and Preview:

- `BACHS_API_KEY`: secret API key beginning with `sk_sandbox_` for testing or `sk_live_` for production.
- `BACHS_WEBHOOK_SECRET`: signing secret for the matching webhook endpoint/environment.

Do not use a publishable `pk_` key. Never put either secret in frontend code or commit it to GitHub.

## Register the webhook

In the Bachs Developer Portal, create a webhook destination:

`https://YOUR-PRODUCTION-DOMAIN/api/bachs-webhook`

Subscribe to:
- `collection.succeeded`
- `collection.failed`
- `collection.underpaid`
- `checkout.expired`

Copy that endpoint's signing secret into `BACHS_WEBHOOK_SECRET`. Sandbox and live endpoints have separate secrets. When switching from sandbox to live, update both credentials together.

## Test before going live

1. Use a sandbox API key and sandbox webhook secret in Vercel Preview.
2. Create a test image or video campaign.
3. Complete a sandbox checkout.
4. Confirm the campaign changes from `pending_payment` to `pending_review` only after the signed `collection.succeeded` webhook.
5. Confirm the Super Admin can approve it and that its 7-, 14- or 30-day period begins at approval.
6. Confirm failed, underpaid and expired checkouts remain unpublished.
7. Switch to live credentials only after the full sandbox test succeeds.

The browser redirect is not treated as proof of payment. The webhook signature, checkout ID, amount and currency are verified server-side before the campaign can enter moderation.
