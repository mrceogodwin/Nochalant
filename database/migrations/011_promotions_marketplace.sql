CREATE TABLE IF NOT EXISTS promotion_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  campaign_type text NOT NULL CHECK (campaign_type IN ('image','video')),
  package_code text NOT NULL CHECK (package_code IN ('image_7d','video_7d','premium_14d','extended_30d')),
  title text NOT NULL CHECK (char_length(title) BETWEEN 3 AND 120),
  description text NOT NULL DEFAULT '' CHECK (char_length(description) <= 1200),
  media_url text,
  media_object_key text,
  destination_url text,
  contact_text text,
  amount_minor integer NOT NULL CHECK (amount_minor > 0),
  currency char(3) NOT NULL CHECK (currency IN ('NGN','USD')),
  payment_status text NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid','pending','paid','failed','refunded')),
  payment_reference text UNIQUE,
  moderation_status text NOT NULL DEFAULT 'pending_payment' CHECK (moderation_status IN ('pending_payment','pending_review','approved','rejected','paused','expired')),
  starts_at timestamptz,
  ends_at timestamptz,
  impressions_count bigint NOT NULL DEFAULT 0,
  clicks_count bigint NOT NULL DEFAULT 0,
  reviewed_by uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  rejection_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS promotion_campaigns_public_idx
  ON promotion_campaigns (moderation_status, ends_at DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS promotion_campaigns_owner_idx
  ON promotion_campaigns (owner_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS promotion_campaigns_payment_idx
  ON promotion_campaigns (payment_status, created_at DESC);
DROP TRIGGER IF EXISTS promotion_campaigns_set_updated_at ON promotion_campaigns;
CREATE TRIGGER promotion_campaigns_set_updated_at
  BEFORE UPDATE ON promotion_campaigns
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();