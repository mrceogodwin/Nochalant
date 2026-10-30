-- Nochalant Faces: explicitly marked demo profiles for the first homepage preview.
-- These are NOT Neon Auth accounts and must never be represented as real people.
CREATE TABLE IF NOT EXISTS community_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id text UNIQUE,
  username text NOT NULL UNIQUE,
  display_name text NOT NULL,
  avatar_url text,
  bio text NOT NULL DEFAULT '',
  is_public boolean NOT NULL DEFAULT true,
  is_demo boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT community_profiles_demo_auth_check CHECK (is_demo = false OR auth_user_id IS NULL)
);

CREATE INDEX IF NOT EXISTS community_profiles_public_order_idx
  ON community_profiles(is_public, is_demo, sort_order, created_at DESC);

INSERT INTO community_profiles (username, display_name, bio, is_public, is_demo, sort_order)
VALUES
  ('thecultureplug', 'Culture Plug', 'Nochalant demo profile', true, true, 1),
  ('naijavibe', 'Naija Vibe', 'Nochalant demo profile', true, true, 2),
  ('theplaylist', 'The Playlist', 'Nochalant demo profile', true, true, 3),
  ('streettalk', 'Street Talk', 'Nochalant demo profile', true, true, 4),
  ('lagosafterdark', 'Lagos After Dark', 'Nochalant demo profile', true, true, 5),
  ('benincitygist', 'Benin City Gist', 'Nochalant demo profile', true, true, 6),
  ('thefilmroom', 'The Film Room', 'Nochalant demo profile', true, true, 7),
  ('freshsounds', 'Fresh Sounds', 'Nochalant demo profile', true, true, 8),
  ('styleplug', 'Style Plug', 'Nochalant demo profile', true, true, 9),
  ('theweekendlink', 'Weekend Link', 'Nochalant demo profile', true, true, 10)
ON CONFLICT (username) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  bio = EXCLUDED.bio,
  is_public = EXCLUDED.is_public,
  is_demo = EXCLUDED.is_demo,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();
