-- Artist music download totals.
-- Downloads are counted only when the server-side download endpoint records a
-- completed file delivery. This does not fabricate historical download counts.
ALTER TABLE music_tracks
  ADD COLUMN IF NOT EXISTS download_count bigint NOT NULL DEFAULT 0
  CHECK (download_count >= 0);

CREATE INDEX IF NOT EXISTS music_tracks_artist_public_idx
  ON music_tracks(artist_id, status, download_count DESC);
