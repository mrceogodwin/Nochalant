-- Paid artist verification and silver badge eligibility.
-- Payment and editorial approval are deliberately separate gates.
ALTER TABLE artist_profiles
  ADD COLUMN IF NOT EXISTS verification_payment_status text NOT NULL DEFAULT 'unpaid'
    CHECK (verification_payment_status IN ('unpaid','pending','paid','failed','refunded')),
  ADD COLUMN IF NOT EXISTS verification_payment_reference text,
  ADD COLUMN IF NOT EXISTS verification_paid_at timestamptz;

CREATE TABLE IF NOT EXISTS artist_verification_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id uuid NOT NULL REFERENCES artist_profiles(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  gateway text NOT NULL DEFAULT 'bachs',
  payment_reference text NOT NULL UNIQUE,
  amount_minor bigint NOT NULL CHECK (amount_minor > 0),
  currency text NOT NULL DEFAULT 'NGN',
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','paid','failed','refunded')),
  checkout_url text,
  gateway_transaction_id text,
  gateway_payload jsonb,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS artist_verification_payments_artist_idx
  ON artist_verification_payments(artist_id, created_at DESC);
CREATE INDEX IF NOT EXISTS artist_verification_payments_status_idx
  ON artist_verification_payments(status, created_at DESC);

DROP TRIGGER IF EXISTS artist_verification_payments_updated_at ON artist_verification_payments;
CREATE TRIGGER artist_verification_payments_updated_at
  BEFORE UPDATE ON artist_verification_payments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
