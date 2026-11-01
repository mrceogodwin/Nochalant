-- Add an atomic processing claim for webhook event deduplication.
-- Existing events retain their current state; stale processing claims can be
-- reclaimed by a provider retry after five minutes.
ALTER TABLE payment_webhook_events
  DROP CONSTRAINT IF EXISTS payment_webhook_events_processing_status_check;

ALTER TABLE payment_webhook_events
  ADD CONSTRAINT payment_webhook_events_processing_status_check
  CHECK (processing_status IN ('received','processing','processed','ignored','failed'));
