-- Nochalant Social video-posting feature flag.
-- Video posting is disabled by default. Only the server-side Super Admin API
-- may update this setting; do not expose direct database access to clients.

CREATE TABLE IF NOT EXISTS social_feature_settings (
  setting_key text PRIMARY KEY CHECK (setting_key = 'video_posts_enabled'),
  enabled boolean NOT NULL DEFAULT false,
  updated_by uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO social_feature_settings (setting_key, enabled)
VALUES ('video_posts_enabled', false)
ON CONFLICT (setting_key) DO NOTHING;
