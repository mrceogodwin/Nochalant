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

## Current scope
The authenticated My Club ID API reads real profile, event, rank, badge, scene, squad, and membership records. Feature-specific award integrations, moderator tooling, reputation history UI, and automated tests remain separate follow-up work. Do not describe reputation awards as live until those integrations exist.
