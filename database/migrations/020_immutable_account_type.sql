-- Lock each member to the account type selected during registration.
-- Existing members with a selected type retain it. Profiles with no type remain
-- eligible to make their first selection and are locked at that point.
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS account_type_locked_at timestamptz;

UPDATE user_profiles
SET account_type_locked_at = COALESCE(account_type_locked_at, now())
WHERE account_type_locked_at IS NULL
  AND account_type IS NOT NULL
  AND btrim(account_type) <> '';

CREATE OR REPLACE FUNCTION prevent_account_type_change_after_registration()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.account_type_locked_at IS NOT NULL
     AND (
       NEW.account_type IS DISTINCT FROM OLD.account_type
       OR NEW.account_type_locked_at IS DISTINCT FROM OLD.account_type_locked_at
     ) THEN
    RAISE EXCEPTION 'Account type and its registration lock are immutable'
      USING ERRCODE = 'check_violation';
  END IF;

  IF OLD.account_type_locked_at IS NULL
     AND NEW.account_type_locked_at IS NULL
     AND NEW.account_type IS DISTINCT FROM OLD.account_type THEN
    RAISE EXCEPTION 'Initial account type selection must be locked'
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS user_profiles_account_type_immutable
  ON user_profiles;

CREATE TRIGGER user_profiles_account_type_immutable
BEFORE UPDATE OF account_type, account_type_locked_at ON user_profiles
FOR EACH ROW
EXECUTE FUNCTION prevent_account_type_change_after_registration();
