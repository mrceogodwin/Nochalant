-- Add a structured design payload for premium text promotions.
ALTER TABLE promotion_campaigns ADD COLUMN IF NOT EXISTS design_config jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE promotion_campaigns DROP CONSTRAINT IF EXISTS promotion_campaigns_media_kind_check;
ALTER TABLE promotion_campaigns ADD CONSTRAINT promotion_campaigns_media_kind_check CHECK (media_kind IS NULL OR media_kind IN ('image','video','text'));
