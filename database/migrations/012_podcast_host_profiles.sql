-- Add editable host profile fields to each podcast series.
ALTER TABLE podcast_shows ADD COLUMN IF NOT EXISTS host_role text;
ALTER TABLE podcast_shows ADD COLUMN IF NOT EXISTS host_bio text NOT NULL DEFAULT '';
ALTER TABLE podcast_shows ADD COLUMN IF NOT EXISTS host_image_url text;
