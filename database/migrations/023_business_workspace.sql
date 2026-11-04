-- Business workspace profile; additive and isolated to the preview migration branch until approved.
CREATE TABLE IF NOT EXISTS business_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_profile_id uuid NOT NULL UNIQUE REFERENCES user_profiles(id) ON DELETE CASCADE,
  business_name text NOT NULL CHECK (char_length(business_name) BETWEEN 2 AND 140),
  category text NOT NULL DEFAULT 'Other',
  bio text NOT NULL DEFAULT '',
  website_url text,
  contact_email text,
  location text,
  logo_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS business_profiles_name_idx ON business_profiles (business_name);
DROP TRIGGER IF EXISTS business_profiles_updated_at ON business_profiles;
CREATE TRIGGER business_profiles_updated_at BEFORE UPDATE ON business_profiles
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
