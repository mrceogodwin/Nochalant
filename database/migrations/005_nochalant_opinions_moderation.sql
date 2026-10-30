-- Nochalant Opinions, reporting and account enforcement.
-- Apply after migrations 001-004. This migration is safe to re-run.

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS account_status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS suspended_until timestamptz,
  ADD COLUMN IF NOT EXISTS moderation_note text,
  ADD COLUMN IF NOT EXISTS moderated_at timestamptz,
  ADD COLUMN IF NOT EXISTS moderated_by uuid REFERENCES user_profiles(id) ON DELETE SET NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_profiles_account_status_check'
      AND conrelid = 'user_profiles'::regclass
  ) THEN
    ALTER TABLE user_profiles
      ADD CONSTRAINT user_profiles_account_status_check
      CHECK (account_status IN ('active','suspended','banned'));
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS community_opinions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE RESTRICT,
  body text NOT NULL CHECK (char_length(body) BETWEEN 8 AND 500),
  topic text NOT NULL DEFAULT 'Culture'
    CHECK (topic IN ('Music','Entertainment','Fashion','Lifestyle','Nightlife','Sports','Culture','Other')),
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','published','hidden','removed')),
  featured boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  moderated_by uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  moderated_at timestamptz,
  moderation_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS community_opinions_feed_idx
  ON community_opinions(status, published_at DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS community_opinions_author_idx
  ON community_opinions(author_id, created_at DESC);

CREATE TABLE IF NOT EXISTS opinion_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opinion_id uuid NOT NULL REFERENCES community_opinions(id) ON DELETE CASCADE,
  reporter_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE RESTRICT,
  reason text NOT NULL
    CHECK (reason IN ('Harassment or bullying','Hate or discrimination','Sexual content','Violence or threats','Spam or scam','False or harmful information','Other')),
  details text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'open'
    CHECK (status IN ('open','reviewing','resolved','dismissed')),
  reviewed_by uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(opinion_id, reporter_id)
);
CREATE INDEX IF NOT EXISTS opinion_reports_queue_idx
  ON opinion_reports(status, created_at DESC);

ALTER TABLE moderation_actions
  ADD COLUMN IF NOT EXISTS opinion_id uuid REFERENCES community_opinions(id) ON DELETE SET NULL;

ALTER TABLE moderation_actions
  DROP CONSTRAINT IF EXISTS moderation_actions_action_check;
ALTER TABLE moderation_actions
  ADD CONSTRAINT moderation_actions_action_check
  CHECK (action IN (
    'warning','hide','remove','restore','suspend','unsuspend',
    'ban','unban','dismiss_report','resolve_report','approve_opinion','reject_opinion'
  ));

DROP TRIGGER IF EXISTS community_opinions_updated_at ON community_opinions;
CREATE TRIGGER community_opinions_updated_at
  BEFORE UPDATE ON community_opinions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
