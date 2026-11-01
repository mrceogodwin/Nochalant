# Nochalant Social

## Member experience

The member Social screen is backed by the authenticated `/api/social` route and currently includes:

- For You and Following feeds.
- Text posts with public or followers-only visibility.
- Likes, comments and member follows.
- Suggested members and notification inbox.
- Text stories that expire after 24 hours, with public/followers visibility and view tracking.
- Member profile editing: display name, username, bio, website, location and HTTPS avatar URL.

## API actions

Authenticated requests use a Neon Auth bearer token.

- `GET /api/social?feed=for-you`
- `GET /api/social?feed=following`
- `GET /api/social?stories=1`
- `GET /api/social?profile=1`
- `GET /api/social?commentsFor=<post-uuid>`
- `GET /api/social?notifications=1`
- `POST /api/social` with `create_post`, `comment`, `toggle_like`, `follow`, `unfollow`, `create_story`, `view_story`, `update_profile`, or `mark_notification_read`.

The route is rewritten to the existing admin opinions serverless handler to avoid increasing the Vercel serverless-function count.

## Database prerequisites

- Migration 002: community posts, comments, reactions, follows and notifications.
- Migration 008: account types.
- Migration 015: member profile details.
- Migration 019: story records and story views.

Apply and verify missing migrations in a non-production Neon branch first. Do not expose Stories in production until migration 019 is applied and verified.

## Deliberate safety boundaries

Stories are text-only. Image/video posts, story media, DMs, reposts and bookmarks are not enabled in this milestone. Media requires signed uploads, private storage, file-type/size checks, malware scanning, moderation review and expiring delivery URLs before launch.

## Release gate

A green GitHub Actions test, dependency audit and production build are required on the latest pull-request head. Vercel deployment availability is tracked separately; a build-rate-limit response is not a successful deployment.
