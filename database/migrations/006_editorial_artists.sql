-- Nochalant editorial artist spotlight catalog.
-- This is distinct from artist_profiles: the spotlight catalog is editorially
-- curated by Super Admins, while artist_profiles are creator-owned accounts.
-- Apply after migrations 001-005. Safe to re-run.
CREATE TABLE IF NOT EXISTS artists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(trim(name)) BETWEEN 1 AND 100),
  genre text,
  image_url text,
  profile_url text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS artists_homepage_idx
  ON artists(is_active, sort_order ASC, name ASC);

DROP TRIGGER IF EXISTS artists_updated_at ON artists;
CREATE TRIGGER artists_updated_at
  BEFORE UPDATE ON artists
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
