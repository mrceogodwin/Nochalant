# Nochalant Club — Reputation and rank rules

## Source of truth
- Reputation is the sum of non-reversed `ReputationEvent.points` records.
- The browser never submits XP amounts and there is no public award endpoint.
- Trusted server-side feature handlers may call `awardReputation` after verifying the underlying action.
- Every award requires a unique idempotency key tied to the source record.
- Reversals retain the original event and set `reversedAt`; profile XP and rank are recalculated.

## Allowed award rules
| Rule | XP | Per-member daily limit |
|---|---:|---:|
| ONBOARDING_COMPLETE | 25 | 1 |
| JOIN_SCENE | 10 | 3 |
| CONSTRUCTIVE_POST | 5 | 5 |
| HELPFUL_REACTION_RECEIVED | 2 | 10 |
| HOST_SUCCESSFUL_EVENT | 20 | 2 |
| HELPFUL_MEMBER_RECOGNITION | 5 | 5 |
| ACCEPTED_MUSIC_FEEDBACK | 5 | 5 |

A member may earn at most 100 reputation XP per Lagos calendar day. Purchases, paid placement, raw message volume, and self-awarded actions are not eligible.

## Rank thresholds
| Rank | Minimum XP |
|---|---:|
| New Face | 0 |
| Regular | 100 |
| Familiar | 300 |
| Vibe Curator | 700 |
| Scene Connector | 1,500 |
| Culture Keeper | 3,000 |
| Scene Legend | 6,000 |
| Icon | 12,000 |
| Grandmaster | 25,000 |
| Club Royalty | 50,000 |

## Integration requirement
Call `awardReputation` only from trusted server handlers after the action has succeeded. Use source-specific idempotency keys, e.g. `scene-join:<sceneMemberId>`. Never add a client route that accepts an arbitrary user ID, rule key, or XP value.

## Integrated award triggers
- Successful email verification awards ONBOARDING_COMPLETE once per account.
- A newly created or reactivated public Scene membership awards JOIN_SCENE. Pending private-Scene requests and repeat requests do not award XP.
- Both triggers use source-specific idempotency keys. Award failures are logged and do not roll back the underlying account verification or membership action.

## Current scope
The authenticated My Club ID API reads real profile, event, rank, badge, Scene, Squad, and membership records. The server-side award/reversal service and these two award triggers are implemented. Remaining work includes moderation tooling for reversals, reputation history UI, action integrations for reviewed constructive posts, earned helpful reactions, successful hosted events and accepted music feedback, plus automated service tests. Do not award reputation for unreviewed content, raw message volume, purchases, or paid placement.
