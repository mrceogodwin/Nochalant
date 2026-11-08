CREATE TYPE "CreatorApplicationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED');

CREATE TABLE "CreatorMonetizationApplication" (
  "id" TEXT NOT NULL,
  "applicantUserId" TEXT NOT NULL,
  "sceneId" TEXT,
  "sceneName" TEXT,
  "requestedFeatures" TEXT[] NOT NULL,
  "audienceSummary" VARCHAR(2000) NOT NULL,
  "status" "CreatorApplicationStatus" NOT NULL DEFAULT 'PENDING',
  "reviewedById" TEXT,
  "reviewNote" VARCHAR(1000),
  "reviewedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CreatorMonetizationApplication_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CreatorLedgerEntry" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "entryType" TEXT NOT NULL,
  "amountKobo" BIGINT NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'NGN',
  "sourceType" TEXT NOT NULL,
  "sourceId" TEXT,
  "idempotencyKey" TEXT NOT NULL,
  "availableAt" TIMESTAMP(3),
  "reversedAt" TIMESTAMP(3),
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CreatorLedgerEntry_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CreatorLedgerEntry_idempotencyKey_key" ON "CreatorLedgerEntry"("idempotencyKey");
CREATE INDEX "CreatorMonetizationApplication_applicantUserId_status_createdAt_idx" ON "CreatorMonetizationApplication"("applicantUserId", "status", "createdAt");
CREATE INDEX "CreatorMonetizationApplication_status_createdAt_idx" ON "CreatorMonetizationApplication"("status", "createdAt");
CREATE INDEX "CreatorLedgerEntry_userId_createdAt_idx" ON "CreatorLedgerEntry"("userId", "createdAt");
CREATE INDEX "CreatorLedgerEntry_userId_availableAt_reversedAt_idx" ON "CreatorLedgerEntry"("userId", "availableAt", "reversedAt");

ALTER TABLE "CreatorMonetizationApplication" ADD CONSTRAINT "CreatorMonetizationApplication_applicantUserId_fkey" FOREIGN KEY ("applicantUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CreatorLedgerEntry" ADD CONSTRAINT "CreatorLedgerEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
