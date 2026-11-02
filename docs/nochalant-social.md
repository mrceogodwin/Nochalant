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
- Migration 015: member profile details.
- Migration 019: story records and story views.
- Migration 020: immutable account-type registration lock (adds `account_type_locked_at` and its database trigger).

The live production Neon schema currently lacks `user_profile_details`, `user_account_types`, `social_stories`, `social_story_views`, and `user_profiles.account_type_locked_at`; these are present on the preflight branch. The production schema also lacks `podcast_staff_accounts`, which is a separate outstanding schema difference and must be traced to its owning migration before podcast staff workflows are enabled.

Apply and verify all prerequisite migrations in a non-production Neon branch first. Do not expose Social stories or account-type activation in production until the corresponding schema is applied and verified. Migration 020 locks existing members to their current account type; review this effect against the existing member base before production rollout.

## Deliberate safety boundaries

Stories are text-only. Image/video posts, story media, DMs, reposts and bookmarks are not enabled in this milestone. Media requires signed uploads, private storage, file-type/size checks, malware scanning, moderation review and expiring delivery URLs before launch.

## Release gate

A green GitHub Actions test, dependency audit and production build are required on the latest pull-request head. Vercel deployment availability is tracked separately; a build-rate-limit response is not a successful deployment.
