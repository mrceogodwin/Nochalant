-- Nochalant core schema
-- Apply only after the Nochalant Neon project is provisioned and reviewed.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id text NOT NULL UNIQUE,
  display_name text NOT NULL,
  email text,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('member','editor','admin','super_admin')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE RESTRICT,
  title text NOT NULL CHECK (char_length(title) BETWEEN 8 AND 180),
  body text NOT NULL CHECK (char_length(body) BETWEEN 20 AND 12000),
  category text NOT NULL CHECK (category IN ('Lifestyle','Clubs & Nightlife','Entertainment','Music','Nollywood','Street Buzz','Business','Agenda')),
  source_url text,
  content_fingerprint text NOT NULL,
  submission_type text NOT NULL DEFAULT 'free' CHECK (submission_type IN ('free','carousel')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_review','approved','scheduled','published','rejected')),
  submission_day date NOT NULL DEFAULT (timezone('Africa/Lagos', now())::date),
  editorial_notes text,
  scheduled_for timestamptz,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT submissions_unique_author_fingerprint UNIQUE (author_id, content_fingerprint)
);

CREATE UNIQUE INDEX IF NOT EXISTS submissions_one_free_per_day
  ON submissions(author_id, submission_day)
  WHERE submission_type = 'free';

CREATE UNIQUE INDEX IF NOT EXISTS submissions_unique_content_fingerprint
  ON submissions(content_fingerprint)
  WHERE status <> 'rejected';

CREATE INDEX IF NOT EXISTS submissions_queue_idx ON submissions(status, created_at DESC);
CREATE INDEX IF NOT EXISTS submissions_author_idx ON submissions(author_id, created_at DESC);

CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL UNIQUE REFERENCES submissions(id) ON DELETE RESTRICT,
  provider text NOT NULL CHECK (provider IN ('paystack','flutterwave')),
  provider_reference text NOT NULL UNIQUE,
  amount_kobo bigint NOT NULL CHECK (amount_kobo = 599900),
  currency char(3) NOT NULL DEFAULT 'NGN' CHECK (currency = 'NGN'),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','successful','failed','refunded')),
  verified_at timestamptz,
  raw_event jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS carousel_placements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL REFERENCES submissions(id) ON DELETE RESTRICT,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  position integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (ends_at > starts_at)
);

CREATE INDEX IF NOT EXISTS carousel_active_idx
  ON carousel_placements(active, starts_at, ends_at);

CREATE TABLE IF NOT EXISTS agenda_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'Events',
  venue text,
  city text,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz,
  ticket_url text,
  image_url text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','cancelled')),
  created_by uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS editorial_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  submission_id uuid REFERENCES submissions(id) ON DELETE SET NULL,
  action text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS user_profiles_updated_at ON user_profiles;
CREATE TRIGGER user_profiles_updated_at BEFORE UPDATE ON user_profiles
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS submissions_updated_at ON submissions;
CREATE TRIGGER submissions_updated_at BEFORE UPDATE ON submissions
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS agenda_events_updated_at ON agenda_events;
CREATE TRIGGER agenda_events_updated_at BEFORE UPDATE ON agenda_events
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
