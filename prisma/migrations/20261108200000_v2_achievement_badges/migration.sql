-- Idempotent additive migration: the generated V2 baseline may already include these
-- fields on a fresh database, while an existing database may still need them.
ALTER TABLE "BadgeCatalog"
  ADD COLUMN IF NOT EXISTS "criteria" JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE "UserBadge"
  ADD COLUMN IF NOT EXISTS "revokedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "revokedById" TEXT,
  ADD COLUMN IF NOT EXISTS "revocationReason" VARCHAR(500);

CREATE INDEX IF NOT EXISTS "UserBadge_revokedAt_earnedAt_idx"
  ON "UserBadge"("revokedAt", "earnedAt");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'UserBadge_revokedById_fkey'
      AND conrelid = '"UserBadge"'::regclass
  ) THEN
    ALTER TABLE "UserBadge"
      ADD CONSTRAINT "UserBadge_revokedById_fkey"
      FOREIGN KEY ("revokedById") REFERENCES "User"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
