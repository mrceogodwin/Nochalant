-- Preserve provider refund identifiers and actual settled amounts for Bachs reconciliation.
ALTER TABLE payment_refunds
  ADD COLUMN IF NOT EXISTS provider_refund_id text,
  ADD COLUMN IF NOT EXISTS refunded_amount_minor bigint
    CHECK (refunded_amount_minor IS NULL OR refunded_amount_minor > 0);

CREATE UNIQUE INDEX IF NOT EXISTS payment_refunds_provider_refund_id_unique
  ON payment_refunds (provider_refund_id)
  WHERE provider_refund_id IS NOT NULL;
