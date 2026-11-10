CREATE SCHEMA IF NOT EXISTS social;

CREATE TABLE IF NOT EXISTS social.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  username text NOT NULL UNIQUE,
  display_name text NOT NULL,
  password_hash text,
  google_sub text UNIQUE,
  avatar_url text,
  bio text NOT NULL DEFAULT '',
  location text NOT NULL DEFAULT 'Nigeria',
  interests text[] NOT NULL DEFAULT '{}',
  onboarded boolean NOT NULL DEFAULT false,
  is_admin boolean NOT NULL DEFAULT false,
  is_pro boolean NOT NULL DEFAULT false,
  pro_plan text,
  pro_renews_at timestamptz,
  wallet_naira integer NOT NULL DEFAULT 0,
  verified boolean NOT NULL DEFAULT false,
  posts_count integer NOT NULL DEFAULT 0,
  followers_count integer NOT NULL DEFAULT 0,
  following_count integer NOT NULL DEFAULT 0,
  gift_total integer NOT NULL DEFAULT 0,
  gifts_received integer NOT NULL DEFAULT 0,
  bank_name text,
  account_number text,
  account_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS social.sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES social.users(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS social.follows (
  follower_id uuid NOT NULL REFERENCES social.users(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES social.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, following_id)
);

CREATE TABLE IF NOT EXISTS social.groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'Community',
  icon text NOT NULL DEFAULT '👥',
  owner_id uuid REFERENCES social.users(id) ON DELETE SET NULL,
  member_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS social.group_members (
  group_id uuid NOT NULL REFERENCES social.groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES social.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member',
  PRIMARY KEY (group_id, user_id)
);

CREATE TABLE IF NOT EXISTS social.scenes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  scene_type text NOT NULL,
  category text NOT NULL DEFAULT 'Talk',
  host_id uuid REFERENCES social.users(id) ON DELETE SET NULL,
  group_id uuid REFERENCES social.groups(id) ON DELETE SET NULL,
  is_private boolean NOT NULL DEFAULT false,
  is_adult boolean NOT NULL DEFAULT false,
  is_live boolean NOT NULL DEFAULT false,
  listener_count integer NOT NULL DEFAULT 0,
  tags text[] NOT NULL DEFAULT '{}',
  pinned_message text,
  trend_label text,
  cover_key text NOT NULL DEFAULT 'mic',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS social.scene_members (
  scene_id uuid NOT NULL REFERENCES social.scenes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES social.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'listener',
  muted boolean NOT NULL DEFAULT false,
  PRIMARY KEY (scene_id, user_id)
);

CREATE TABLE IF NOT EXISTS social.speak_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scene_id uuid NOT NULL REFERENCES social.scenes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES social.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (scene_id, user_id)
);

CREATE TABLE IF NOT EXISTS social.scene_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scene_id uuid NOT NULL REFERENCES social.scenes(id) ON DELETE CASCADE,
  user_id uuid REFERENCES social.users(id) ON DELETE SET NULL,
  body text NOT NULL,
  likes integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS social.scene_message_likes (
  message_id uuid NOT NULL REFERENCES social.scene_messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES social.users(id) ON DELETE CASCADE,
  PRIMARY KEY (message_id, user_id)
);

CREATE TABLE IF NOT EXISTS social.posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES social.groups(id) ON DELETE CASCADE,
  user_id uuid REFERENCES social.users(id) ON DELETE SET NULL,
  body text NOT NULL,
  media_key text,
  tag text NOT NULL DEFAULT 'all',
  likes integer NOT NULL DEFAULT 0,
  comments_count integer NOT NULL DEFAULT 0,
  reposts integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS social.post_likes (
  post_id uuid NOT NULL REFERENCES social.posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES social.users(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, user_id)
);

CREATE TABLE IF NOT EXISTS social.comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES social.posts(id) ON DELETE CASCADE,
  user_id uuid REFERENCES social.users(id) ON DELETE SET NULL,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS social.chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL,
  title text,
  group_id uuid REFERENCES social.groups(id) ON DELETE CASCADE,
  scene_id uuid REFERENCES social.scenes(id) ON DELETE CASCADE,
  is_public boolean NOT NULL DEFAULT false,
  pinned boolean NOT NULL DEFAULT false,
  last_body text,
  last_at timestamptz NOT NULL DEFAULT now(),
  icon text
);

CREATE TABLE IF NOT EXISTS social.chat_members (
  chat_id uuid NOT NULL REFERENCES social.chats(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES social.users(id) ON DELETE CASCADE,
  unread integer NOT NULL DEFAULT 0,
  PRIMARY KEY (chat_id, user_id)
);

CREATE TABLE IF NOT EXISTS social.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id uuid NOT NULL REFERENCES social.chats(id) ON DELETE CASCADE,
  user_id uuid REFERENCES social.users(id) ON DELETE SET NULL,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS social.gifts (
  id text PRIMARY KEY,
  name text NOT NULL,
  price_naira integer NOT NULL,
  emoji text NOT NULL,
  category text NOT NULL,
  sort integer NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS social.gift_sends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gift_id text NOT NULL REFERENCES social.gifts(id),
  from_user uuid NOT NULL REFERENCES social.users(id) ON DELETE CASCADE,
  to_user uuid NOT NULL REFERENCES social.users(id) ON DELETE CASCADE,
  scene_id uuid REFERENCES social.scenes(id) ON DELETE SET NULL,
  amount_naira integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS social.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES social.users(id) ON DELETE CASCADE,
  kind text NOT NULL,
  amount_naira integer NOT NULL,
  title text NOT NULL,
  detail text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS social.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'Talk',
  host_id uuid REFERENCES social.users(id) ON DELETE SET NULL,
  scene_id uuid REFERENCES social.scenes(id) ON DELETE SET NULL,
  starts_at timestamptz NOT NULL,
  is_live boolean NOT NULL DEFAULT false,
  listener_count integer NOT NULL DEFAULT 0,
  cover_key text NOT NULL DEFAULT 'mic'
);

CREATE TABLE IF NOT EXISTS social.event_reminders (
  event_id uuid NOT NULL REFERENCES social.events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES social.users(id) ON DELETE CASCADE,
  PRIMARY KEY (event_id, user_id)
);

CREATE TABLE IF NOT EXISTS social.games (
  slug text PRIMARY KEY,
  name text NOT NULL,
  blurb text NOT NULL DEFAULT '',
  playing integer NOT NULL DEFAULT 0,
  cover_key text NOT NULL DEFAULT 'cards'
);

CREATE TABLE IF NOT EXISTS social.matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_slug text NOT NULL REFERENCES social.games(slug),
  player_a uuid REFERENCES social.users(id) ON DELETE SET NULL,
  player_b uuid REFERENCES social.users(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'live',
  watching integer NOT NULL DEFAULT 0,
  state jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS social.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES social.users(id) ON DELETE CASCADE,
  reference text NOT NULL UNIQUE,
  purpose text NOT NULL,
  plan text,
  amount_naira integer NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS social.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES social.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text NOT NULL,
  href text,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS social.saved_items (
  user_id uuid NOT NULL REFERENCES social.users(id) ON DELETE CASCADE,
  kind text NOT NULL,
  ref_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, kind, ref_id)
);

CREATE TABLE IF NOT EXISTS social.scene_visits (
  user_id uuid NOT NULL REFERENCES social.users(id) ON DELETE CASCADE,
  scene_id uuid NOT NULL REFERENCES social.scenes(id) ON DELETE CASCADE,
  visited_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, scene_id)
);

CREATE TABLE IF NOT EXISTS social.invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES social.users(id) ON DELETE CASCADE,
  kind text NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  href text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sessions_user_idx ON social.sessions (user_id);
CREATE INDEX IF NOT EXISTS scene_messages_scene_idx ON social.scene_messages (scene_id, created_at);
CREATE INDEX IF NOT EXISTS posts_group_idx ON social.posts (group_id, created_at DESC);
CREATE INDEX IF NOT EXISTS chat_messages_chat_idx ON social.chat_messages (chat_id, created_at);
CREATE INDEX IF NOT EXISTS notifications_user_idx ON social.notifications (user_id, created_at DESC);

ALTER TABLE social.payments ADD COLUMN IF NOT EXISTS provider text NOT NULL DEFAULT 'test';
ALTER TABLE social.payments ADD COLUMN IF NOT EXISTS checkout_id text;
ALTER TABLE social.payments ADD COLUMN IF NOT EXISTS gift_id text;
ALTER TABLE social.payments ADD COLUMN IF NOT EXISTS counterparty_id uuid;
ALTER TABLE social.payments ADD COLUMN IF NOT EXISTS scene_id uuid;

ALTER TABLE social.users ADD COLUMN IF NOT EXISTS bachs_account_id text;
ALTER TABLE social.users ADD COLUMN IF NOT EXISTS bachs_destination_id text;

CREATE TABLE IF NOT EXISTS social.payment_events (
  event_id text PRIMARY KEY,
  reference text,
  received_at timestamptz NOT NULL DEFAULT now()
);
