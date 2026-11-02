-- Nochalant Social stories and creator profile foundation.
-- Stories are text-only in this milestone. Media uploads stay disabled until
-- the dedicated upload, storage, scanning and moderation pipeline is ready.

CREATE TABLE IF NOT EXISTS social_stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  body text NOT NULL CHECK (char_length(btrim(body)) BETWEEN 1 AND 500),
  visibility text NOT NULL DEFAULT 'public' CHECK (visibility IN ('public','followers')),
  status text NOT NULL DEFAULT 'published' CHECK (status IN ('published','removed')),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours'),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (expires_at > created_at)
);

CREATE INDEX IF NOT EXISTS social_stories_active_feed_idx
  ON social_stories(status, expires_at DESC, created_at DESC);

CREATE INDEX IF NOT EXISTS social_stories_author_idx
  ON social_stories(author_id, created_at DESC);

CREATE TABLE IF NOT EXISTS social_story_views (
  story_id uuid NOT NULL REFERENCES social_stories(id) ON DELETE CASCADE,
  viewer_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  viewed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (story_id, viewer_id)
);

CREATE INDEX IF NOT EXISTS social_story_views_viewer_idx
  ON social_story_views(viewer_id, viewed_at DESC);
