-- Creator workspace: profile, portfolio and booking inbox.
-- Apply to preview/staging first; production rollout requires separate approval.
BEGIN;

CREATE TABLE IF NOT EXISTS creator_profiles (
  user_profile_id uuid PRIMARY KEY REFERENCES user_profiles(id) ON DELETE CASCADE,
  display_title text NOT NULL DEFAULT '',
  creator_category text NOT NULL DEFAULT 'content_creator',
  bio text NOT NULL DEFAULT '',
  location text,
  website_url text,
  contact_email text,
  booking_enabled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT creator_profiles_category_check CHECK (creator_category IN ('content_creator','influencer','photographer','videographer','writer','presenter','comedian','other')),
  CONSTRAINT creator_profiles_title_length CHECK (char_length(display_title) <= 120),
  CONSTRAINT creator_profiles_bio_length CHECK (char_length(bio) <= 3000)
);

CREATE TABLE IF NOT EXISTS creator_portfolio_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (char_length(trim(title)) BETWEEN 2 AND 120),
  description text NOT NULL DEFAULT '' CHECK (char_length(description) <= 1000),
  media_url text,
  external_url text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS creator_portfolio_owner_idx ON creator_portfolio_items(creator_user_id, sort_order, created_at DESC);

CREATE TABLE IF NOT EXISTS creator_booking_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  requester_name text NOT NULL CHECK (char_length(trim(requester_name)) BETWEEN 2 AND 120),
  requester_email text NOT NULL CHECK (char_length(trim(requester_email)) BETWEEN 5 AND 254),
  message text NOT NULL CHECK (char_length(trim(message)) BETWEEN 10 AND 3000),
  requested_for timestamptz,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined','cancelled')),
  creator_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS creator_booking_owner_idx ON creator_booking_requests(creator_user_id, status, created_at DESC);

COMMIT;
