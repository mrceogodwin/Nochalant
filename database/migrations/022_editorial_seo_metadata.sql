-- Editorial SEO metadata for public, crawlable article pages.
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS slug text;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS seo_title text;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS seo_description text;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS focus_keyword text;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS canonical_url text;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS og_image_url text;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS is_indexable boolean NOT NULL DEFAULT true;
CREATE UNIQUE INDEX IF NOT EXISTS submissions_slug_unique ON submissions(slug) WHERE slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS submissions_public_seo_idx ON submissions(status,published_at DESC) WHERE is_indexable=true;
