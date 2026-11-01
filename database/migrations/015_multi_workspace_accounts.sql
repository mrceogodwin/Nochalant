-- Nochalant multi-workspace account capabilities
-- Additive migration: preserves existing user_profiles.account_type and user identities.
CREATE TABLE IF NOT EXISTS user_account_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_profile_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  account_type text NOT NULL CHECK (account_type IN ('fan','artist','creator','event_organizer','business','media')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','pending','disabled')),
  is_primary boolean NOT NULL DEFAULT false,
  activated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_profile_id, account_type)
);
CREATE INDEX IF NOT EXISTS user_account_types_user_status_idx
  ON user_account_types(user_profile_id, status);
CREATE UNIQUE INDEX IF NOT EXISTS user_account_types_one_primary_idx
  ON user_account_types(user_profile_id) WHERE is_primary = true AND status = 'active';

-- Backfill every existing account's current type as its primary active workspace.
INSERT INTO user_account_types (user_profile_id, account_type, status, is_primary)
SELECT id, account_type, 'active', true FROM user_profiles
ON CONFLICT (user_profile_id, account_type) DO UPDATE
SET status = 'active', is_primary = true, updated_at = now();

CREATE TABLE IF NOT EXISTS user_profile_details (
  user_profile_id uuid PRIMARY KEY REFERENCES user_profiles(id) ON DELETE CASCADE,
  username text UNIQUE,
  avatar_url text,
  bio text NOT NULL DEFAULT '',
  website_url text,
  location text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS podcast_staff_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_profile_id uuid NOT NULL UNIQUE REFERENCES user_profiles(id) ON DELETE CASCADE,
  invited_by uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  staff_role text NOT NULL CHECK (staff_role IN ('podcast_manager','producer','editor','host')),
  status text NOT NULL DEFAULT 'invited' CHECK (status IN ('invited','active','suspended','revoked')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS podcast_staff_accounts_status_idx
  ON podcast_staff_accounts(status, staff_role);

DROP TRIGGER IF EXISTS user_account_types_updated_at ON user_account_types;
CREATE TRIGGER user_account_types_updated_at BEFORE UPDATE ON user_account_types
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS user_profile_details_updated_at ON user_profile_details;
CREATE TRIGGER user_profile_details_updated_at BEFORE UPDATE ON user_profile_details
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS podcast_staff_accounts_updated_at ON podcast_staff_accounts;
CREATE TRIGGER podcast_staff_accounts_updated_at BEFORE UPDATE ON podcast_staff_accounts
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
