# Nochalant V2 — Paid Scene Bachs setup

This integration is isolated from the legacy Promotions webhook. Do not point the legacy Promotions destination at this route.

## Environment variables

Configure these as encrypted Vercel environment variables for the V2 Preview environment first:

- `BACHS_API_KEY`: Bachs sandbox secret key (`sk_sandbox_...`) for testing.
- `BACHS_WEBHOOK_SECRET`: signing secret for the V2 webhook destination.

Never expose either value to browser code or commit them to the repository. Keep sandbox and live credentials paired.

## Webhook destination

Register this V2 destination in the Bachs dashboard:

`https://YOUR-PREVIEW-DOMAIN/api/v2/bachs-webhook`

Subscribe to:
- `collection.succeeded`
- `collection.failed`
- `collection.underpaid`
- `checkout.expired`
- `refund.created`
- `refund.paid`
- `refund.failed`

Use the signing secret issued for this exact destination. Leave the existing `/api/bachs-webhook` Promotions destination unchanged.

## Sandbox acceptance checklist

1. Create a paid Scene as a creator with an approved monetisation application.
2. Confirm the checkout amount is taken from the Scene's stored price, not browser input.
3. Complete a sandbox payment and confirm the signed success webhook activates exactly one Scene membership.
4. Replay the same webhook event and confirm it is idempotent.
5. Test failed, underpaid and expired checkout events; none may activate membership.
6. Test a partial refund and confirm membership remains active while the refund is recorded.
7. Test a second partial refund that makes cumulative refunds equal the payment total; confirm membership is cancelled.
8. Test an invalid signature, mismatched amount, currency, payment reference, charge ID and conflicting refund ID; none may grant or revoke access incorrectly.
9. Confirm the V2 payment, webhook and refund records are visible in Neon and that the legacy Promotions tables and webhook behavior remain unchanged.

## Release gates

- Do not apply the V2 migration to production Neon until the migration has been reviewed and the V2 deployment is ready.
- Do not change the live Bachs webhook destination or use live credentials before the complete sandbox checklist passes.
- Creator payout remains disabled. Do not credit creator earnings or configure a revenue split until the platform commission policy, creator terms, compliance checks and payout API have been approved.
