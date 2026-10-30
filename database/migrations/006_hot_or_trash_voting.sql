-- Hot or Trash: authenticated, one-person-one-vote community poll.
-- Apply after migrations 001-005. Safe to re-run.
CREATE TABLE IF NOT EXISTS hot_trash_polls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  question text NOT NULL CHECK (char_length(question) BETWEEN 3 AND 180),
  context text NOT NULL DEFAULT '',
  image_url text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('draft','active','closed')),
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (ends_at IS NULL OR ends_at > starts_at)
);
CREATE TABLE IF NOT EXISTS hot_trash_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id uuid NOT NULL REFERENCES hot_trash_polls(id) ON DELETE RESTRICT,
  voter_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE RESTRICT,
  choice text NOT NULL CHECK (choice IN ('hot','trash')),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT hot_trash_one_vote_per_member UNIQUE (poll_id, voter_id)
);
CREATE INDEX IF NOT EXISTS hot_trash_votes_poll_choice_idx
  ON hot_trash_votes(poll_id, choice);
INSERT INTO hot_trash_polls (slug, question, context, image_url, status)
VALUES (
  'homepage-fashion-feature',
  'Hot or trash?',
  'No be every trend we go follow. Is this look giving what it should give?',
  'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=1000&q=85',
  'active'
)
ON CONFLICT (slug) DO NOTHING;
