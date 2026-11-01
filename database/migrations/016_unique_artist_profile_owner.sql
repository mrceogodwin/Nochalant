-- Enforce one creator-owned Artist profile per member.
-- This migration intentionally fails if duplicate owners already exist.
-- Resolve any duplicates through a reviewed data-reconciliation plan before retrying.
CREATE UNIQUE INDEX IF NOT EXISTS artist_profiles_owner_user_id_key
  ON artist_profiles(owner_user_id);
