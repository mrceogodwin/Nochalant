-- Nochalant Auto-Post: free RSS discovery and editorial publishing controls.
-- Run on development/preflight first. The daily runner uses Vercel Cron; no paid AI/API is required.
CREATE TABLE IF NOT EXISTS editorial_auto_post_settings (
  id boolean PRIMARY KEY DEFAULT true CHECK (id = true),
  enabled boolean NOT NULL DEFAULT false,
  auto_publish boolean NOT NULL DEFAULT false,
  daily_limit integer NOT NULL DEFAULT 5 CHECK (daily_limit BETWEEN 1 AND 20),
  last_run_at timestamptz,
  updated_by uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO editorial_auto_post_settings (id) VALUES (true) ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS editorial_content_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  feed_url text NOT NULL UNIQUE,
  category text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS editorial_discovered_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid REFERENCES editorial_content_sources(id) ON DELETE SET NULL,
  title text NOT NULL,
  summary text NOT NULL DEFAULT '',
  source_url text NOT NULL UNIQUE,
  image_url text,
  category text NOT NULL,
  source_name text NOT NULL,
  published_at timestamptz,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','published','dismissed')),
  submission_id uuid REFERENCES submissions(id) ON DELETE SET NULL,
  discovered_at timestamptz NOT NULL DEFAULT now(),
  published_to_site_at timestamptz
);
CREATE INDEX IF NOT EXISTS editorial_discovered_queue_idx
  ON editorial_discovered_items(status, discovered_at DESC);
CREATE INDEX IF NOT EXISTS editorial_sources_enabled_idx
  ON editorial_content_sources(enabled) WHERE enabled = true;
