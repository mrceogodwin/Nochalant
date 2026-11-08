# Nochalant Club Achievement & Badge Engine

## Principles
- Badges represent verified participation, not spending.
- Members cannot submit XP, achievement counts, badge IDs for other accounts, or award requests.
- Trusted server handlers evaluate badge rules after a successful action.
- A badge award is unique per member and badge.
- Automatic awards create an audit event.
- A moderator may revoke an award only with a reason; the award row remains in the database with the moderator ID, timestamp and reason.
- Normal activity never silently restores a revoked badge.

## Seeded achievement catalogue
| Badge | Requirement |
|---|---|
| Scene Starter | 1 active Scene membership |
| Scene Regular | 5 active Scene memberships |
| Scene Explorer | 10 active Scene memberships |
| First Post | 1 published Club post |
| Conversation Starter | 10 published Club posts |
| Community Voice | 50 published Club posts |
| Squad Builder | 3 Squad memberships |
| Rising Reputation | 100 verified reputation XP |
| Culture Keeper | 1,000 verified reputation XP |

## Trigger points
- Successful reputation awards evaluate XP-based and participation badges.
- Successful active Scene joins evaluate Scene badges, including when the reputation daily cap is reached.
- Successful Club post creation evaluates post badges.
- Pending private-Scene requests do not count as active Scene memberships.
- Unpublished content does not count toward post achievements.

## Moderation
The /admin/achievements workspace is restricted to active, verified OWNER, ADMIN and MODERATOR assignments. Revocation requires a reason between 8 and 500 characters and writes a BADGE_REVOKED audit event in the same database transaction as the revocation.

## Deployment
The additive Prisma migration is 20261108200000_v2_achievement_badges. Apply it to the intended Neon environment through the approved migration workflow, then run the existing seed command to populate badge definitions. Do not run the migration or seed against production until the target database is confirmed.
