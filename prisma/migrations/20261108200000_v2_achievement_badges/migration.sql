-- Add criteria-driven Club badges and retain an auditable revocation record.
ALTER TABLE "BadgeCatalog"
  ADD COLUMN "criteria" JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE "UserBadge"
  ADD COLUMN "revokedAt" TIMESTAMP(3),
  ADD COLUMN "revokedById" TEXT,
  ADD COLUMN "revocationReason" VARCHAR(500);

CREATE INDEX "UserBadge_revokedAt_earnedAt_idx"
  ON "UserBadge"("revokedAt", "earnedAt");

ALTER TABLE "UserBadge"
  ADD CONSTRAINT "UserBadge_revokedById_fkey"
  FOREIGN KEY ("revokedById") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
