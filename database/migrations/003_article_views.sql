-- Nochalant article readership counts.
-- Counts distinct browser visitors per article using a long-lived anonymous cookie.
CREATE TABLE IF NOT EXISTS post_view_counts (
  post_slug text PRIMARY KEY CHECK (post_slug ~ '^[a-z0-9_-]{1,80}$'),
  view_count bigint NOT NULL DEFAULT 0 CHECK (view_count >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS post_viewers (
  post_slug text NOT NULL REFERENCES post_view_counts(post_slug) ON DELETE CASCADE,
  visitor_hash text NOT NULL,
  first_viewed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (post_slug, visitor_hash)
);

CREATE INDEX IF NOT EXISTS post_viewers_first_viewed_idx
  ON post_viewers(first_viewed_at DESC);
