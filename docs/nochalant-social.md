# Nochalant Social

## Member experience

The member Social screen is backed by the authenticated `/api/social` route and currently includes:

- For You and Following feeds.
- Text posts with public or followers-only visibility.
- Likes, comments and member follows.
- Suggested members and notification inbox.
- Text stories that expire after 24 hours, with public/followers visibility and view tracking.
- Public creator/member profiles with recent posts, follower counts and follow/unfollow actions.
- Member profile editing: display name, username, bio, website, location and HTTPS avatar URL.

## API actions

Authenticated requests use a Neon Auth bearer token.

- `GET /api/social?feed=for-you`
- `GET /api/social?feed=following`
- `GET /api/social?stories=1`
- `GET /api/social?profile=1`
- `GET /api/social?member=<profile-uuid>`
- `GET /api/social?commentsFor=<post-uuid>`
- `GET /api/social?notifications=1`
- `POST /api/social` with `create_post`, `comment`, `toggle_like`, `follow`, `unfollow`, `create_story`, `view_story`, `update_profile`, or `mark_notification_read`.

The route is rewritten to the existing admin opinions serverless handler to avoid increasing the Vercel serverless-function count.

## Database prerequisites

- Migration 002: community posts, comments, reactions, follows and notifications.
- Migration 008: account types.
- Migration 015 (`015_multi_workspace_accounts.sql`): account-type memberships, profile details and podcast staff accounts. It backfills each existing member's current account type as their primary membership.
- Migration 016 (`016_unique_artist_profile_owner.sql`): enforces one Artist profile per member. Production currently has no duplicate artist-profile owners.
- Migration 019 (`019_social_stories.sql`): text story records and story views.
- Migration 020 (`020_immutable_account_type.sql`): immutable account-type registration lock (adds `account_type_locked_at` and its database trigger).

A read-only production-versus-preflight schema comparison confirms that migrations 015, 016, 019 and 020 are still outstanding on production. The preflight branch contains their expected schema. Migration 015 backfills one primary membership for each existing user; migration 020 locks each existing user to their current account type. Review these additive changes before production rollout.

Apply and verify all prerequisite migrations in numeric order on a non-production branch first. Do not enable Social Stories, account-profile editing, account-type activation or podcast staff workflows in production until the corresponding schema is applied and verified.
## Deliberate safety boundaries

Stories are text-only. Image/video posts, story media, DMs, reposts and bookmarks are not enabled in this milestone. Media requires signed uploads, private storage, file-type/size checks, malware scanning, moderation review and expiring delivery URLs before launch.

## Release gate

A green GitHub Actions test, dependency audit and production build are required on the latest pull-request head. Vercel deployment availability is tracked separately; a build-rate-limit response is not a successful deployment.
