-- Account type is a product capability selector, not an authorization role.
-- Artist verification and editorial permissions remain separately controlled.
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS account_type text NOT NULL DEFAULT 'fan';

ALTER TABLE user_profiles
  DROP CONSTRAINT IF EXISTS user_profiles_account_type_check;

ALTER TABLE user_profiles
  ADD CONSTRAINT user_profiles_account_type_check
  CHECK (account_type IN (
    'fan',
    'artist',
    'creator',
    'event_organizer',
    'business',
    'media'
  ));

CREATE INDEX IF NOT EXISTS user_profiles_account_type_idx
  ON user_profiles(account_type, created_at DESC);
