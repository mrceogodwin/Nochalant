-- Media / Publisher workspace: publication identity and editorial pitch tracking.
-- Additive schema; apply to isolated preview/test branch before production approval.
BEGIN;

CREATE TABLE IF NOT EXISTS media_profiles (
  user_profile_id uuid PRIMARY KEY REFERENCES user_profiles(id) ON DELETE CASCADE,
  publication_name text NOT NULL CHECK (char_length(trim(publication_name)) BETWEEN 2 AND 160),
  outlet_type text NOT NULL DEFAULT 'digital_publication'
    CHECK (outlet_type IN ('digital_publication','blog','radio','television','print','podcast','other')),
  bio text NOT NULL DEFAULT '' CHECK (char_length(bio) <= 3000),
  website_url text,
  contact_email text,
  location text,
  beats text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS media_pitch_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_profile_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (char_length(trim(title)) BETWEEN 8 AND 180),
  category text NOT NULL DEFAULT 'Entertainment',
  summary text NOT NULL CHECK (char_length(trim(summary)) BETWEEN 30 AND 5000),
  source_url text,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','in_review','accepted','rejected')),
  editor_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS media_pitch_owner_idx
  ON media_pitch_submissions(user_profile_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS media_pitch_review_queue_idx
  ON media_pitch_submissions(status, created_at ASC);

DROP TRIGGER IF EXISTS media_profiles_updated_at ON media_profiles;
CREATE TRIGGER media_profiles_updated_at BEFORE UPDATE ON media_profiles
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS media_pitch_submissions_updated_at ON media_pitch_submissions;
CREATE TRIGGER media_pitch_submissions_updated_at BEFORE UPDATE ON media_pitch_submissions
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMIT;
