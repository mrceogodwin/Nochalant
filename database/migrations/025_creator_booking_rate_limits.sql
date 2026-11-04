-- Public creator booking intake abuse controls.
-- Additive schema; apply to preview/test first and approve production separately.
BEGIN;
CREATE TABLE IF NOT EXISTS creator_booking_rate_limits (
  ip_hash text NOT NULL,
  window_bucket bigint NOT NULL,
  request_count integer NOT NULL DEFAULT 0 CHECK (request_count >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (ip_hash, window_bucket)
);
CREATE INDEX IF NOT EXISTS creator_booking_rate_limits_cleanup_idx
  ON creator_booking_rate_limits(window_bucket);
COMMIT;
