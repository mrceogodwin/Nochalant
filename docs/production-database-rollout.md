# Nochalant production database rollout

## Current audit status (2026-11-02)

- Neon project: `nochalant` (`fancy-hall-40653071`), Frankfurt region.
- Production branch: `production` (`br-jolly-term-ba4i3ynt`).
- Preflight branch: `nochalant-multi-workspace-preflight-20261101` (`br-polished-cherry-ba4vdhnm`).
- The preflight branch passes the current database health requirements (46/46 required tables, required columns, immutable-account-type trigger, and required unique indexes).
- Production is behind preflight. The read-only audit found five missing tables: `podcast_staff_accounts`, `social_stories`, `social_story_views`, `user_account_types`, and `user_profile_details`.
- Production is also missing `payment_refunds.provider_refund_id`, `payment_refunds.refunded_amount_minor`, `user_profiles.account_type_locked_at`, the artist-owner unique index, the refund-provider unique index, and the immutable-account-type trigger.
- The webhook processing constraint and `set_updated_at()` function are already present.
- The production and preflight audit found zero duplicate artist-owner groups at audit time. Recheck immediately before rollout.

## Required production migrations

Apply these additive migrations in order, after taking a Neon restore point/backup and confirming the target branch is `production`:

1. `015_multi_workspace_accounts.sql` — creates account-type workspaces, profile details, podcast staff accounts, and backfills the existing primary account type.
2. `016_unique_artist_profile_owner.sql` — enforces one creator-owned artist profile per member. It will fail if duplicate `artist_profiles.owner_user_id` values exist; resolve duplicates through a reviewed data-reconciliation plan rather than deleting records automatically.
3. `018_bachs_refund_reconciliation.sql` — adds provider refund identifiers and settled minor-unit amounts plus a partial unique index.
4. `019_social_stories.sql` — creates text-only 24-hour stories and view tracking. It does not enable image/video uploads.
5. `020_immutable_account_type.sql` — locks each existing account's selected account type and installs the update-prevention trigger.

Migration `017_payment_webhook_processing_claim.sql` is already represented by the production webhook-processing constraint; do not reapply it blindly.

## Rollout gates

- Do not apply migrations to production from an unverified connection string or branch.
- Confirm a current Neon restore point and recheck duplicate artist owners.
- Apply the migrations one at a time, in order, recording the result of each.
- Run the database health endpoint/check after the final migration. It must report all 46 required tables, no missing columns, the account-type immutable trigger, and both required unique indexes.
- Run registration/account-type, profile, podcast staff, refund reconciliation, and text-story smoke tests against a non-production branch first.
- Keep story media uploads disabled until the separate upload, private storage, validation, malware-scanning, and moderation pipeline is implemented.
- Do not promote or deploy to production until the preview is current, runtime/API smoke tests pass, and the release is explicitly approved.

## Current release blockers

- Vercel rejected a new preview deployment with HTTP 402: `api-deployments-free-per-day` (retry after the daily limit resets). Existing READY previews are not the latest feature-branch commit and do not verify the latest UI changes.
- Production Neon is missing the migrations listed above.
- The feature PR must remain draft until a fresh preview and production database health gates pass.
