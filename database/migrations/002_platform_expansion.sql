-- Nochalant platform expansion (additive migration)
-- Prerequisite: apply 001_initial_schema.sql first.
-- This migration creates the core music, artist, chart, promotion, community,
-- commerce and moderation data model. It does not create credentials or enable
-- client-side database access. All writes must go through authenticated server APIs.

-- Allow the existing legacy submission-payment table to record Bachs payments.
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_provider_check;
ALTER TABLE payments ADD CONSTRAINT payments_provider_check
  CHECK (provider IN ('paystack','flutterwave','bachs'));

-- Artist identity and verification.
CREATE TABLE IF NOT EXISTS artist_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE RESTRICT,
  stage_name text NOT NULL,
  slug text NOT NULL UNIQUE,
  bio text NOT NULL DEFAULT '',
  avatar_url text,
  banner_url text,
  country_code char(2) NOT NULL DEFAULT 'NG',
  city text,
  verification_status text NOT NULL DEFAULT 'unverified'
    CHECK (verification_status IN ('unverified','pending','verified','rejected','suspended')),
  verified_at timestamptz,
  verified_by uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS artist_profiles_owner_idx ON artist_profiles(owner_user_id);
CREATE INDEX IF NOT EXISTS artist_profiles_status_idx ON artist_profiles(verification_status);

-- Artist releases and tracks. Rights evidence is explicit and reviewable.
CREATE TABLE IF NOT EXISTS music_releases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id uuid NOT NULL REFERENCES artist_profiles(id) ON DELETE RESTRICT,
  title text NOT NULL,
  release_type text NOT NULL CHECK (release_type IN ('single','ep','album','mixtape')),
  cover_art_url text,
  release_date date,
  genre text NOT NULL,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','submitted','under_review','approved','rejected','published','takedown')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS music_releases_artist_idx ON music_releases(artist_id, release_date DESC);
CREATE INDEX IF NOT EXISTS music_releases_status_idx ON music_releases(status, created_at DESC);

CREATE TABLE IF NOT EXISTS music_tracks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  release_id uuid NOT NULL REFERENCES music_releases(id) ON DELETE RESTRICT,
  artist_id uuid NOT NULL REFERENCES artist_profiles(id) ON DELETE RESTRICT,
  title text NOT NULL,
  audio_object_key text,
  duration_seconds integer CHECK (duration_seconds IS NULL OR duration_seconds > 0),
  isrc text,
  explicit_content boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','approved','published','rejected','takedown')),
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS music_tracks_release_idx ON music_tracks(release_id);
CREATE INDEX IF NOT EXISTS music_tracks_artist_idx ON music_tracks(artist_id, created_at DESC);
CREATE INDEX IF NOT EXISTS music_tracks_status_idx ON music_tracks(status, published_at DESC);

CREATE TABLE IF NOT EXISTS music_rights_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id uuid NOT NULL REFERENCES music_tracks(id) ON DELETE RESTRICT,
  submitted_by uuid NOT NULL REFERENCES user_profiles(id) ON DELETE RESTRICT,
  rights_type text NOT NULL CHECK (rights_type IN ('master','publishing','distribution','artist_authorisation','other')),
  rights_holder_name text NOT NULL,
  evidence_object_key text,
  territory_codes text[] NOT NULL DEFAULT ARRAY['NG'],
  starts_on date,
  ends_on date,
  review_status text NOT NULL DEFAULT 'pending'
    CHECK (review_status IN ('pending','approved','rejected','expired')),
  reviewed_by uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (ends_on IS NULL OR starts_on IS NULL OR ends_on >= starts_on)
);
CREATE INDEX IF NOT EXISTS music_rights_track_idx ON music_rights_records(track_id, review_status);

-- Chart definitions and immutable-ish periodic snapshots. Paid campaigns never
-- directly set chart positions; entries must be calculated from eligible plays.
CREATE TABLE IF NOT EXISTS music_charts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  genre text NOT NULL,
  region text,
  chart_size integer NOT NULL DEFAULT 100 CHECK (chart_size BETWEEN 1 AND 500),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS chart_periods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chart_id uuid NOT NULL REFERENCES music_charts(id) ON DELETE RESTRICT,
  period_start date NOT NULL,
  period_end date NOT NULL,
  status text NOT NULL DEFAULT 'calculating'
    CHECK (status IN ('calculating','published','archived')),
  calculated_at timestamptz,
  published_at timestamptz,
  UNIQUE(chart_id, period_start, period_end),
  CHECK (period_end >= period_start)
);

CREATE TABLE IF NOT EXISTS chart_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chart_period_id uuid NOT NULL REFERENCES chart_periods(id) ON DELETE CASCADE,
  track_id uuid NOT NULL REFERENCES music_tracks(id) ON DELETE RESTRICT,
  rank integer NOT NULL CHECK (rank > 0),
  eligible_play_count bigint NOT NULL DEFAULT 0 CHECK (eligible_play_count >= 0),
  unique_listener_count bigint NOT NULL DEFAULT 0 CHECK (unique_listener_count >= 0),
  previous_rank integer CHECK (previous_rank IS NULL OR previous_rank > 0),
  movement text NOT NULL DEFAULT 'new' CHECK (movement IN ('up','down','same','new')),
  UNIQUE(chart_period_id, track_id),
  UNIQUE(chart_period_id, rank)
);
CREATE INDEX IF NOT EXISTS chart_entries_track_idx ON chart_entries(track_id);

-- Play events are accepted only by trusted server-side ingestion after playback
-- validation. Provider event IDs provide idempotency; raw IP/device identifiers
-- should not be stored here.
CREATE TABLE IF NOT EXISTS music_play_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id uuid NOT NULL REFERENCES music_tracks(id) ON DELETE RESTRICT,
  listener_user_id uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  anonymous_listener_hash text,
  session_hash text NOT NULL,
  source text NOT NULL DEFAULT 'nochalant',
  provider_event_id text UNIQUE,
  listened_seconds integer NOT NULL DEFAULT 0 CHECK (listened_seconds >= 0),
  duration_seconds integer CHECK (duration_seconds IS NULL OR duration_seconds > 0),
  eligible boolean NOT NULL DEFAULT false,
  rejection_reason text,
  played_at timestamptz NOT NULL DEFAULT now(),
  CHECK (listener_user_id IS NOT NULL OR anonymous_listener_hash IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS music_play_events_track_time_idx ON music_play_events(track_id, played_at DESC)
  WHERE eligible = true;
CREATE INDEX IF NOT EXISTS music_play_events_listener_idx ON music_play_events(listener_user_id, played_at DESC)
  WHERE eligible = true;

-- Promotional campaigns and sponsored inventory, kept separate from chart ranking.
CREATE TABLE IF NOT EXISTS promotion_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE RESTRICT,
  artist_id uuid REFERENCES artist_profiles(id) ON DELETE RESTRICT,
  track_id uuid REFERENCES music_tracks(id) ON DELETE RESTRICT,
  submission_id uuid REFERENCES submissions(id) ON DELETE RESTRICT,
  campaign_type text NOT NULL
    CHECK (campaign_type IN ('featured_carousel','sponsored_story','sponsored_track','artist_profile','event_promotion')),
  title text NOT NULL,
  budget_minor bigint NOT NULL CHECK (budget_minor > 0),
  currency char(3) NOT NULL DEFAULT 'NGN',
  starts_at timestamptz,
  ends_at timestamptz,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','pending_payment','pending_review','approved','active','paused','completed','rejected','cancelled')),
  sponsored_label_required boolean NOT NULL DEFAULT true CHECK (sponsored_label_required = true),
  reviewed_by uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (ends_at IS NULL OR starts_at IS NULL OR ends_at > starts_at)
);
CREATE INDEX IF NOT EXISTS promotion_campaigns_status_idx ON promotion_campaigns(status, starts_at, ends_at);
CREATE INDEX IF NOT EXISTS promotion_campaigns_buyer_idx ON promotion_campaigns(buyer_user_id, created_at DESC);

-- General payment orders support more than the legacy fixed-price submission flow.
CREATE TABLE IF NOT EXISTS payment_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE RESTRICT,
  campaign_id uuid REFERENCES promotion_campaigns(id) ON DELETE RESTRICT,
  order_type text NOT NULL
    CHECK (order_type IN ('promotion','subscription','event_ticket','digital_service','other')),
  provider text NOT NULL CHECK (provider IN ('bachs','paystack','flutterwave')),
  provider_reference text UNIQUE,
  idempotency_key text NOT NULL UNIQUE,
  amount_minor bigint NOT NULL CHECK (amount_minor > 0),
  currency char(3) NOT NULL DEFAULT 'NGN',
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('created','pending','successful','failed','cancelled','refunded','partially_refunded')),
  checkout_url text,
  paid_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS payment_orders_user_idx ON payment_orders(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS payment_orders_status_idx ON payment_orders(status, created_at DESC);

CREATE TABLE IF NOT EXISTS payment_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  provider_event_id text NOT NULL,
  event_type text NOT NULL,
  signature_verified boolean NOT NULL DEFAULT false,
  processing_status text NOT NULL DEFAULT 'received'
    CHECK (processing_status IN ('received','processed','ignored','failed')),
  payload jsonb NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  error_message text,
  UNIQUE(provider, provider_event_id)
);
CREATE INDEX IF NOT EXISTS payment_webhook_status_idx ON payment_webhook_events(processing_status, received_at);

CREATE TABLE IF NOT EXISTS payment_refunds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_order_id uuid NOT NULL REFERENCES payment_orders(id) ON DELETE RESTRICT,
  provider_reference text UNIQUE,
  amount_minor bigint NOT NULL CHECK (amount_minor > 0),
  currency char(3) NOT NULL DEFAULT 'NGN',
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'requested'
    CHECK (status IN ('requested','pending','successful','failed','rejected')),
  requested_by uuid NOT NULL REFERENCES user_profiles(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Subscription entitlements are activated only by verified successful payments.
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE RESTRICT,
  plan_code text NOT NULL,
  provider text NOT NULL CHECK (provider IN ('bachs','paystack','flutterwave')),
  provider_subscription_id text UNIQUE,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','active','past_due','cancelled','expired')),
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS user_subscriptions_user_idx ON user_subscriptions(user_id, status);

-- Community: posts, comments, reactions, follows and reports.
CREATE TABLE IF NOT EXISTS community_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE RESTRICT,
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 10000),
  media jsonb NOT NULL DEFAULT '[]'::jsonb,
  visibility text NOT NULL DEFAULT 'public' CHECK (visibility IN ('public','followers')),
  status text NOT NULL DEFAULT 'published'
    CHECK (status IN ('draft','published','hidden','removed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS community_posts_feed_idx ON community_posts(status, created_at DESC);

CREATE TABLE IF NOT EXISTS community_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE RESTRICT,
  parent_comment_id uuid REFERENCES community_comments(id) ON DELETE CASCADE,
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 4000),
  status text NOT NULL DEFAULT 'published' CHECK (status IN ('published','hidden','removed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS community_comments_post_idx ON community_comments(post_id, created_at);

CREATE TABLE IF NOT EXISTS community_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  post_id uuid REFERENCES community_posts(id) ON DELETE CASCADE,
  comment_id uuid REFERENCES community_comments(id) ON DELETE CASCADE,
  reaction text NOT NULL DEFAULT 'like' CHECK (reaction IN ('like','love','fire','laugh')),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((post_id IS NOT NULL)::integer + (comment_id IS NOT NULL)::integer = 1)
);
CREATE UNIQUE INDEX IF NOT EXISTS community_reactions_post_unique
  ON community_reactions(user_id, post_id, reaction) WHERE post_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS community_reactions_comment_unique
  ON community_reactions(user_id, comment_id, reaction) WHERE comment_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS user_follows (
  follower_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  followed_user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(follower_id, followed_user_id),
  CHECK (follower_id <> followed_user_id)
);

CREATE TABLE IF NOT EXISTS artist_follows (
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  artist_id uuid NOT NULL REFERENCES artist_profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(user_id, artist_id)
);

CREATE TABLE IF NOT EXISTS community_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE RESTRICT,
  post_id uuid REFERENCES community_posts(id) ON DELETE CASCADE,
  comment_id uuid REFERENCES community_comments(id) ON DELETE CASCADE,
  reason text NOT NULL,
  details text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','reviewing','resolved','dismissed')),
  assigned_to uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((post_id IS NOT NULL)::integer + (comment_id IS NOT NULL)::integer = 1)
);
CREATE INDEX IF NOT EXISTS community_reports_queue_idx ON community_reports(status, created_at);

-- Notifications and moderation/audit trail.
CREATE TABLE IF NOT EXISTS user_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  notification_type text NOT NULL,
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  target_path text,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS user_notifications_inbox_idx ON user_notifications(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS moderation_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  moderator_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE RESTRICT,
  target_user_id uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  post_id uuid REFERENCES community_posts(id) ON DELETE SET NULL,
  comment_id uuid REFERENCES community_comments(id) ON DELETE SET NULL,
  action text NOT NULL CHECK (action IN ('warning','hide','remove','restore','suspend','unsuspend','dismiss_report')),
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS moderation_actions_created_idx ON moderation_actions(created_at DESC);

-- Maintain updated_at consistently on mutable platform records.
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'artist_profiles','music_releases','music_tracks','promotion_campaigns',
    'payment_orders','payment_refunds','user_subscriptions','community_posts','community_comments'
  ] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I', t || '_updated_at', t);
    EXECUTE format('CREATE TRIGGER %I BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION set_updated_at()', t || '_updated_at', t);
  END LOOP;
END $$;
