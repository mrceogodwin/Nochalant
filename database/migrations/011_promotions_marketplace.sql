-- Extend the original promotion campaign model with media and launch-package fields.
-- Existing campaign/payment tables are retained for compatibility.
ALTER TABLE promotion_campaigns
  ADD COLUMN IF NOT EXISTS media_kind text,
  ADD COLUMN IF NOT EXISTS package_code text,
  ADD COLUMN IF NOT EXISTS description text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS media_url text,
  ADD COLUMN IF NOT EXISTS media_object_key text,
  ADD COLUMN IF NOT EXISTS destination_url text,
  ADD COLUMN IF NOT EXISTS contact_text text,
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'unpaid',
  ADD COLUMN IF NOT EXISTS payment_reference text,
  ADD COLUMN IF NOT EXISTS rejection_reason text,
  ADD COLUMN IF NOT EXISTS impressions_count bigint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS clicks_count bigint NOT NULL DEFAULT 0;
ALTER TABLE promotion_campaigns
  ADD CONSTRAINT promotion_campaigns_media_kind_check CHECK (media_kind IS NULL OR media_kind IN ('image','video')),
  ADD CONSTRAINT promotion_campaigns_package_code_check CHECK (package_code IS NULL OR package_code IN ('image_7d','video_7d','premium_14d','extended_30d')),
  ADD CONSTRAINT promotion_campaigns_payment_status_check CHECK (payment_status IN ('unpaid','pending','paid','failed','refunded'));
CREATE UNIQUE INDEX IF NOT EXISTS promotion_campaigns_payment_reference_uidx ON promotion_campaigns(payment_reference) WHERE payment_reference IS NOT NULL;
CREATE INDEX IF NOT EXISTS promotion_campaigns_payment_status_idx ON promotion_campaigns(payment_status, created_at DESC);
DROP TRIGGER IF EXISTS promotion_campaigns_set_updated_at ON promotion_campaigns;
CREATE TRIGGER promotion_campaigns_set_updated_at BEFORE UPDATE ON promotion_campaigns FOR EACH ROW EXECUTE FUNCTION set_updated_at();
