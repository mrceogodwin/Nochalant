-- V2-native Bachs checkout metadata. Legacy Promotions payment tables remain untouched.
ALTER TABLE "PaymentTransaction"
  ADD COLUMN IF NOT EXISTS "idempotencyKey" TEXT,
  ADD COLUMN IF NOT EXISTS "providerCheckoutId" TEXT,
  ADD COLUMN IF NOT EXISTS "checkoutUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "metadata" JSONB;

CREATE UNIQUE INDEX IF NOT EXISTS "PaymentTransaction_idempotencyKey_key"
  ON "PaymentTransaction"("idempotencyKey")
  WHERE "idempotencyKey" IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "PaymentTransaction_providerCheckoutId_key"
  ON "PaymentTransaction"("providerCheckoutId")
  WHERE "providerCheckoutId" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "PaymentTransaction_provider_status_createdAt_idx"
  ON "PaymentTransaction"("provider", "status", "createdAt");
