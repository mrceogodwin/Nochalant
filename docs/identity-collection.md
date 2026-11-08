# Nochalant Club Identity Collection

## Catalogue
- 120 main catalogue identities and eight starter identities.
- Original vector artwork is stored in `public/icons/identities/sprite.svg` as individually addressable SVG symbols.
- Database records point to the symbol using `/icons/identities/sprite.svg#<identity-id>`.
- Identity ownership and selected identity are persisted in `UserIcon` and `UserProfile.identityIconId`.

## Rarity
| Tier | Catalogue position | Unlock |
|---|---:|---|
| Common | 001–020 | 0 reputation XP |
| Uncommon | 021–050 | 100 reputation XP |
| Rare | 051–085 | 300 reputation XP |
| Epic | 086–108 | 700 reputation XP |
| Legendary | 109–110 | 1,500 reputation XP |
| Founders Edition | 111–120 | Owner/admin release |

The eight starter identities are granted during registration. Existing members can claim each starter identity from the collection; the server still validates the catalogue condition.

## Security
- Unlock endpoint derives XP and admin privileges from the authenticated member's database records.
- The browser sends only an identity ID; it cannot submit XP, ownership, or another member's ID.
- The selection endpoint verifies ownership before changing the primary identity.
- Unlock requests are safe to retry; the unique `userId + iconId` constraint prevents duplicate ownership.

## Rollout
The seed script updates catalogue records and artwork paths. Run the repository's approved seed process in the intended Neon environment before expecting all 128 identities to appear in the live collection. This documentation and code change do not themselves mutate production data.
