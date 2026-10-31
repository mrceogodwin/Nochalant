-- Nochalant Podcast publishing foundation.
-- Stores shows, seasons, full episodes and short-form clips.
-- Media files are referenced by HTTPS URLs/object keys; this migration does not
-- create storage buckets or expose upload credentials.
-- Safe to re-run.

CREATE TABLE IF NOT EXISTS podcast_shows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  title text NOT NULL CHECK (char_length(trim(title)) BETWEEN 1 AND 180),
  description text NOT NULL DEFAULT '',
  host_name text,
  cover_image_url text,
  trailer_video_url text,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'archived')),
  is_featured boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS podcast_shows_public_idx
  ON podcast_shows(status, is_featured DESC, sort_order ASC, published_at DESC);

CREATE TABLE IF NOT EXISTS podcast_seasons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  show_id uuid NOT NULL REFERENCES podcast_shows(id) ON DELETE CASCADE,
  season_number integer NOT NULL CHECK (season_number > 0),
  title text NOT NULL CHECK (char_length(trim(title)) BETWEEN 1 AND 180),
  description text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'archived')),
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (show_id, season_number),
  UNIQUE (id, show_id)
);

CREATE INDEX IF NOT EXISTS podcast_seasons_public_idx
  ON podcast_seasons(show_id, status, season_number DESC);

CREATE TABLE IF NOT EXISTS podcast_episodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  show_id uuid NOT NULL REFERENCES podcast_shows(id) ON DELETE CASCADE,
  season_id uuid,
  episode_number integer CHECK (episode_number IS NULL OR episode_number > 0),
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  title text NOT NULL CHECK (char_length(trim(title)) BETWEEN 1 AND 180),
  description text NOT NULL DEFAULT '',
  thumbnail_url text,
  video_url text,
  video_object_key text,
  duration_seconds integer CHECK (duration_seconds IS NULL OR duration_seconds >= 0),
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'review', 'published', 'archived')),
  visibility text NOT NULL DEFAULT 'public'
    CHECK (visibility IN ('public', 'unlisted')),
  is_featured boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (season_id, show_id)
    REFERENCES podcast_seasons(id, show_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS podcast_episodes_public_idx
  ON podcast_episodes(show_id, status, visibility, published_at DESC, sort_order ASC);

CREATE INDEX IF NOT EXISTS podcast_episodes_season_idx
  ON podcast_episodes(season_id, episode_number ASC NULLS LAST);

CREATE TABLE IF NOT EXISTS podcast_clips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  episode_id uuid NOT NULL REFERENCES podcast_episodes(id) ON DELETE CASCADE,
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  title text NOT NULL CHECK (char_length(trim(title)) BETWEEN 1 AND 180),
  description text NOT NULL DEFAULT '',
  thumbnail_url text,
  video_url text,
  video_object_key text,
  duration_seconds integer CHECK (duration_seconds IS NULL OR duration_seconds >= 0),
  start_seconds integer CHECK (start_seconds IS NULL OR start_seconds >= 0),
  end_seconds integer CHECK (end_seconds IS NULL OR end_seconds > 0),
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'archived')),
  sort_order integer NOT NULL DEFAULT 0,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (start_seconds IS NULL OR end_seconds IS NULL OR end_seconds > start_seconds)
);

CREATE INDEX IF NOT EXISTS podcast_clips_public_idx
  ON podcast_clips(status, published_at DESC, sort_order ASC);

CREATE INDEX IF NOT EXISTS podcast_clips_episode_idx
  ON podcast_clips(episode_id, sort_order ASC);

DROP TRIGGER IF EXISTS podcast_shows_updated_at ON podcast_shows;
CREATE TRIGGER podcast_shows_updated_at
  BEFORE UPDATE ON podcast_shows
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS podcast_seasons_updated_at ON podcast_seasons;
CREATE TRIGGER podcast_seasons_updated_at
  BEFORE UPDATE ON podcast_seasons
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS podcast_episodes_updated_at ON podcast_episodes;
CREATE TRIGGER podcast_episodes_updated_at
  BEFORE UPDATE ON podcast_episodes
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS podcast_clips_updated_at ON podcast_clips;
CREATE TRIGGER podcast_clips_updated_at
  BEFORE UPDATE ON podcast_clips
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
